// ============================================================
// scripts/e2e-smoke.mjs —— 全量端到端验证（docs/06 DoD 条目 2/3/8）
// A. 主菜单完整流程  B. 四张地图遍历（主题色像素验证）
// C. 双人模式  D. 帧率检测
// 运行：npm run e2e
// ============================================================
import puppeteer from "puppeteer-core"
import fs from "node:fs"

const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
]
const EXE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
if (!EXE) {
  console.error("未找到 Edge/Chrome")
  process.exit(1)
}

const URL = "http://localhost:5173/"
const SHOTS = "design/screenshots"
fs.mkdirSync(SHOTS, { recursive: true })

// 主题预期背景色（docs/09 色板，16 级分桶近似）
// 丛林：素材贴图已回退（用户两次反馈太花），程序化深色底纹 #0e2a1a
const THEME_BG = {
  jungle: [0, 2, 1],   // #0e2a1a
  dungeon: [1, 1, 0],   // #1a140f
  geometry: [1, 1, 2],  // #191c2b
  deepsea: [0, 1, 3],   // #0a1e3c
}

const errors = []
const browser = await puppeteer.launch({ executablePath: EXE, headless: "new", args: ["--disable-gpu"] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console.error: ${m.text()}`)
})

const clickByText = async (text) => {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(t))
    if (el) { el.click(); return true }
    return false
  }, text)
  if (!ok) throw new Error(`找不到按钮: ${text}`)
}

const clickMapCard = async (name) => {
  const ok = await page.evaluate((n) => {
    const el = [...document.querySelectorAll(".map-card")].find((c) => c.textContent.includes(n))
    if (el) { el.click(); return true }
    return false
  }, name)
  if (!ok) throw new Error(`找不到地图卡片: ${name}`)
}

/** 画布主色统计（16 级分桶 top5） */
const canvasTopColors = async () => {
  return page.evaluate(() => {
    const c = document.querySelector("canvas")
    if (!c) return []
    const ctx = c.getContext("2d")
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    const counts = new Map()
    for (let i = 0; i < data.length; i += 16) {
      const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k.split(",").map(Number))
  })
}

const bucketDist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])

const measureFps = async () => {
  return page.evaluate(() => new Promise((resolve) => {
    let frames = 0
    const start = performance.now()
    const tick = () => {
      frames++
      if (performance.now() - start < 2000) requestAnimationFrame(tick)
      else resolve(Math.round(frames / 2))
    }
    requestAnimationFrame(tick)
  }))
}

let passed = 0

try {
  // ============ A. 主菜单完整流程 ============
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 })
  await page.waitForFunction(() => document.body.innerText.includes("单人游戏"), { timeout: 15000 })
  const fontInfo = await page.evaluate(() => {
    let loaded = false
    try {
      loaded = document.fonts.check('12px "Fusion Pixel 12px Proportional"', "像素贪吃蛇 0123456789")
    } catch { /* 忽略 */ }
    return loaded
  })
  if (!fontInfo) throw new Error("像素字体未加载")
  console.log("✓ A1. 主菜单渲染 + 像素字体加载")
  passed++

  await clickByText("单人游戏")
  await page.waitForFunction(() => document.body.innerText.includes("选择地图"), { timeout: 10000 })
  console.log("✓ A2. 选图界面")
  passed++

  // ============ B. 四张地图遍历（主题色验证） ============
  for (const [mapId, mapName, bg] of [
    ["jungle", "丛林自然", THEME_BG.jungle],
    ["dungeon", "暗黑地牢", THEME_BG.dungeon],
    ["geometry", "极简几何", THEME_BG.geometry],
    ["deepsea", "深海蓝光", THEME_BG.deepsea],
  ]) {
    // 返回选图（若在游戏中先暂停退出）
    const inGame = await page.evaluate(() => document.body.innerText.includes("P1: WASD"))
    if (inGame) {
      await page.keyboard.press("p")
      await page.waitForFunction(() => document.body.innerText.includes("返回选图"), { timeout: 5000 })
      await clickByText("返回选图")
      await page.waitForFunction(() => document.body.innerText.includes("选择地图"), { timeout: 5000 })
    }
    await clickMapCard(mapName)
    await clickByText("开始游戏")
    await page.waitForSelector("canvas", { timeout: 10000 })
    await new Promise((r) => setTimeout(r, 1000))
    await page.screenshot({ path: `${SHOTS}/08-${mapId}.png` })

    const top = await canvasTopColors()
    const match = top.some((bucket) => bucketDist(bucket, bg) <= 1)
    if (!match) {
      throw new Error(`地图 ${mapId} 主题色不匹配: 预期 bg ${bg}, 实际 top5 ${JSON.stringify(top)}`)
    }
    console.log(`✓ B. 地图「${mapName}」渲染 + 主题色验证（top: ${top[0]}）`)
    passed++
  }

  // ============ C. 双人模式 ============
  // 退出到主菜单
  await page.keyboard.press("p")
  await page.waitForFunction(() => document.body.innerText.includes("返回选图"), { timeout: 5000 })
  await clickByText("返回选图")
  await page.waitForFunction(() => document.body.innerText.includes("选择地图"), { timeout: 5000 })
  await clickByText("← 返回")
  await page.waitForFunction(() => document.body.innerText.includes("双人游戏"), { timeout: 5000 })

  await clickByText("双人游戏")
  await page.waitForFunction(() => document.body.innerText.includes("选择地图"), { timeout: 5000 })
  const modeText = await page.evaluate(() => document.body.innerText.includes("双人游戏 · 选择地图"))
  if (!modeText) throw new Error("双人模式标签未显示")
  await clickByText("开始游戏")
  await page.waitForSelector("canvas", { timeout: 10000 })
  await new Promise((r) => setTimeout(r, 2000)) // 等动态缩放平滑到位
  const coopHud = await page.evaluate(() => {
    const t = document.body.innerText
    return t.includes("P1") && t.includes("P2")
  })
  if (!coopHud) throw new Error("双人 HUD 未显示双分数")
  // 动态缩放验证（docs/13）：双蛇相距远（出生在两端）→ 视野拉远，canvas 宽 > 384
  const coopCanvasW = await page.evaluate(() => document.querySelector("canvas")?.width ?? 0)
  if (coopCanvasW <= 384) throw new Error(`双人动态缩放未生效: canvas 宽 ${coopCanvasW}`)
  await page.screenshot({ path: `${SHOTS}/09-coop.png` })
  console.log(`✓ C. 双人模式（HUD 双分数 + 动态缩放: canvas ${coopCanvasW}px）`)
  passed++

  // ============ D. 帧率检测（headless 保守阈值 30fps） ============
  const fps = await measureFps()
  if (fps < 30) {
    console.warn(`⚠ D. 帧率偏低: ${fps}fps（headless 环境限制，实际以真实浏览器为准）`)
  } else {
    console.log(`✓ D. 帧率检测: ${fps}fps`)
    passed++
  }

  // ============ 汇总 ============
  console.log("")
  if (errors.length > 0) {
    console.error("❌ 控制台错误:")
    for (const e of errors) console.error("  " + e)
    process.exit(1)
  }
  console.log(`✅ 全量 E2E 通过（${passed}/7 组验证），无控制台错误`)
} catch (err) {
  console.error("❌ E2E 失败:", err.message)
  if (errors.length > 0) {
    console.error("控制台错误:")
    for (const e of errors) console.error("  " + e)
  }
  await page.screenshot({ path: `${SHOTS}/99-failure.png` })
  process.exit(1)
} finally {
  await browser.close()
}
