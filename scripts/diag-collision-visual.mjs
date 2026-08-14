// 临时诊断：找出"判定为障碍但视觉上没有贴图"的格子（跑完删除）
// 在浏览器里渲染每图静态层，逐个碰撞格取中心像素，与背景色比对
import puppeteer from "puppeteer-core"

const EXE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
const browser = await puppeteer.launch({ executablePath: EXE, headless: "new", args: ["--disable-gpu"] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
page.on("pageerror", (e) => console.error("pageerror:", e.message))

await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 })
await new Promise((r) => setTimeout(r, 1500))

// 在页面上下文里动态 import 地图模块并分析
const report = await page.evaluate(async () => {
  const maps = await import("/src/game/maps/index.ts")
  const { renderStaticLayer } = await import("/src/render/staticLayer.ts")
  const { obstacleActiveCells } = await import("/src/game/core/obstacles.ts")
  const out = []
  for (const map of maps.MAPS) {
    const theme = maps.getTheme(map.themeId)
    const canvas = document.createElement("canvas")
    canvas.width = map.grid.w * 16
    canvas.height = map.grid.h * 16
    const layer = renderStaticLayer(map, theme)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(layer, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

    // 碰撞格集合（实体 + 静态）
    const coll = new Set()
    for (const e of map.entities) {
      for (const s of e.shape) coll.add(`${e.origin.x + s.x},${e.origin.y + s.y}`)
    }
    for (const c of map.staticObstacles) coll.add(`${c.x},${c.y}`)

    // 背景色桶
    const bg = theme.palette.bg
    const bgR = parseInt(bg.slice(1, 3), 16), bgG = parseInt(bg.slice(3, 5), 16), bgB = parseInt(bg.slice(5, 7), 16)

    const nearBg = (x, y) => {
      const i = (y * canvas.width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      return Math.abs(r - bgR) < 24 && Math.abs(g - bgG) < 24 && Math.abs(b - bgB) < 24
    }

    const missing = []
    let checked = 0
    for (const k of coll) {
      const [x, y] = k.split(",").map(Number)
      checked++
      // 中心 + 四角 5 点采样，全近背景 = 无贴图
      const pts = [[x * 16 + 8, y * 16 + 8], [x * 16 + 4, y * 16 + 4], [x * 16 + 12, y * 16 + 4], [x * 16 + 4, y * 16 + 12], [x * 16 + 12, y * 16 + 12]]
      const allNear = pts.every(([px, py]) => nearBg(px, py))
      if (allNear) missing.push(k)
    }
    out.push({ id: map.id, checked, missing: missing.slice(0, 40), missingCount: missing.length })
  }
  return out
})

console.log(JSON.stringify(report, null, 2))
await browser.close()
