// ============================================================
// scripts/e2e-smoke.mjs —— 端到端冒烟测试（docs/06 完成定义条目 8）
// 用系统 Edge（puppeteer-core，无需下载浏览器）走完整流程：
// 主菜单 → 选图 → 开始游戏 → 画布验证 → 暂停 → 收集控制台错误
// 运行：node scripts/e2e-smoke.mjs
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

try {
  // 1. 主菜单
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 })
  await page.waitForFunction(() => document.body.innerText.includes("单人游戏"), { timeout: 15000 })
  await page.screenshot({ path: `${SHOTS}/01-menu.png` })

  // 字体实际应用验证（docs/02 法则 5：Fusion Pixel）
  const fontInfo = await page.evaluate(() => {
    const el = document.querySelector(".px-title")
    const family = el ? getComputedStyle(el).fontFamily : ""
    let loaded = false
    try {
      loaded = document.fonts.check('12px "Fusion Pixel 12px Proportional"', "像素贪吃蛇 0123456789")
    } catch { /* 忽略 */ }
    return { family, loaded }
  })
  if (!fontInfo.loaded) throw new Error(`像素字体未加载: ${JSON.stringify(fontInfo)}`)
  console.log(`✓ 1. 主菜单渲染（字体已加载: ${fontInfo.family.slice(0, 60)}…）`)

  // 2. 选图界面
  await clickByText("单人游戏")
  await page.waitForFunction(() => document.body.innerText.includes("选择地图"), { timeout: 10000 })
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: `${SHOTS}/02-mapselect.png` })
  console.log("✓ 2. 选图界面渲染（含缩略图）")

  // 3. 开始游戏 → 画布
  await clickByText("开始游戏")
  await page.waitForSelector("canvas", { timeout: 10000 })
  await new Promise((r) => setTimeout(r, 800)) // 蛇 2.2s 撞右墙，须在此前操作
  await page.screenshot({ path: `${SHOTS}/03-playing.png` })

  // 画布内容验证（有非透明像素 = 确实在绘制）
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector("canvas")
    if (!c) return null
    const ctx = c.getContext("2d")
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    let nonBg = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonBg++
    return { w: c.width, h: c.height, nonBg }
  })
  if (!canvasInfo || canvasInfo.nonBg < 100) {
    throw new Error(`画布内容异常: ${JSON.stringify(canvasInfo)}`)
  }
  console.log(`✓ 3. 游戏画布渲染（${canvasInfo.w}x${canvasInfo.h}，非空像素 ${canvasInfo.nonBg}）`)

  // 4. 暂停/继续（蛇死前）
  await page.keyboard.press("p")
  await page.waitForFunction(() => document.body.innerText.includes("已暂停"), { timeout: 5000 })
  await page.screenshot({ path: `${SHOTS}/04-paused.png` })
  console.log("✓ 4. 暂停菜单")
  await page.keyboard.press("p")
  await new Promise((r) => setTimeout(r, 200))

  // 5. 转向向上 → 撞顶墙 → 结算
  await page.keyboard.press("w")
  await page.waitForFunction(() => document.body.innerText.includes("游戏结束"), { timeout: 8000 })
  await new Promise((r) => setTimeout(r, 400))
  await page.screenshot({ path: `${SHOTS}/05-gameover.png` })
  console.log("✓ 5. 结算界面")

  // 6. 再来一局（R 键）
  await page.keyboard.press("r")
  await new Promise((r) => setTimeout(r, 1200))
  const afterRestart = await page.evaluate(() => !document.body.innerText.includes("游戏结束"))
  if (!afterRestart) throw new Error("R 键重开未生效")
  await page.screenshot({ path: `${SHOTS}/06-restarted.png` })
  console.log("✓ 6. R 键重开生效")

  // 7. 暂停 → 设置弹窗
  await page.keyboard.press("p")
  await page.waitForFunction(() => document.body.innerText.includes("已暂停"), { timeout: 5000 })
  await clickByText("设置")
  await page.waitForFunction(() => document.body.innerText.includes("音效音量"), { timeout: 5000 })
  await page.screenshot({ path: `${SHOTS}/07-settings.png` })
  console.log("✓ 7. 设置弹窗（暂停中打开）")
  await page.keyboard.press("Escape")

  console.log("")
  if (errors.length > 0) {
    console.error("❌ 控制台错误:")
    for (const e of errors) console.error("  " + e)
    process.exit(1)
  }
  console.log("✅ 端到端冒烟测试全部通过，无控制台错误")
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
