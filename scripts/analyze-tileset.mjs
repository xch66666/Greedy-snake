// 临时工具 v2：tileset 块分类 + ASCII 缩略图（跑完删除）
// 用法: node scripts/analyze-tileset.mjs <png路径> [rowStart] [rowEnd]
import fs from "node:fs"
import { PNG } from "pngjs"

const file = process.argv[2]
const rowStart = Number(process.argv[3] ?? 0)
const rowEnd = Number(process.argv[4] ?? 999)
const png = PNG.sync.read(fs.readFileSync(file))
const { width, height } = png
const cols = width / 16
const rows = height / 16
console.log(`尺寸 ${width}x${height}, 网格 ${cols}x${rows}`)

function cls(r, g, b, a) {
  if (a < 40) return "."
  if (g > r * 1.2 && g > b * 1.2) return "G" // 绿
  if (r > g * 1.35 && r > b * 1.1 && r > 90) return "B" // 棕/红
  if (b > r * 1.2 && b > g * 1.15) return "C" // 蓝/青
  const lum = (r + g + b) / 3
  if (lum > 180) return "W" // 白/浅
  if (lum < 70) return "#" // 深
  return "S" // 灰
}

function blockInfo(tx, ty) {
  let content = 0
  const cc = {}
  const grid = []
  for (let gy = 0; gy < 4; gy++) {
    let row = ""
    for (let gx = 0; gx < 4; gx++) {
      let cr = 0, cg = 0, cb = 0, ca = 0
      for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
          const x = tx * 16 + gx * 4 + px
          const y = ty * 16 + gy * 4 + py
          const i = (y * width + x) * 4
          const a = png.data[i + 3]
          if (a > 40) {
            cr += png.data[i]; cg += png.data[i + 1]; cb += png.data[i + 2]; ca++
            content++
          }
        }
      }
      if (ca === 0) { row += " " ; continue }
      const c = cls(cr / ca, cg / ca, cb / ca, 255)
      row += c
      cc[c] = (cc[c] ?? 0) + 1
    }
    grid.push(row)
  }
  const cats = Object.keys(cc).sort().join("")
  const dominant = Object.entries(cc).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "."
  return { content, cats, dominant, grid }
}

// 第一遍：分类汇总
console.log("=== 分类索引 (行x列: 内容数/类别) ===")
for (let ty = rowStart; ty < Math.min(rows, rowEnd); ty++) {
  const line = []
  for (let tx = 0; tx < cols; tx++) {
    const { content, cats, dominant } = blockInfo(tx, ty)
    if (content < 5) { line.push("空"); continue }
    line.push(`${tx},${ty}:${content}${dominant}`)
  }
  if (line.length) console.log(`行${ty}: ${line.join(" ")}`)
}

// 第二遍：dump 指定坐标的 4x4 图（参数: tx ty）
const dumpTx = Number(process.argv[5])
const dumpTy = Number(process.argv[6])
if (!Number.isNaN(dumpTx)) {
  const { grid } = blockInfo(dumpTx, dumpTy)
  console.log(`\n=== 块 (${dumpTx},${dumpTy}) 4x4 缩略图 (G绿 B棕 S灰 C青 W白 #深 .透明) ===`)
  for (const row of grid) console.log("  |" + row + "|")
}
