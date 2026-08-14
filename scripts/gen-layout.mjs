// ============================================================
// scripts/gen-layout.mjs —— 从地图数据生成 ASCII 布局图（docs/11）
// 用法: node scripts/gen-layout.mjs
// ============================================================
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"

// 用 esbuild 把 maps 模块打包为可执行 JS
const result = await esbuild.build({
  entryPoints: ["src/game/maps/index.ts"],
  bundle: true,
  format: "esm",
  write: false,
  platform: "node",
})
const code = result.outputFiles[0].text
const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"))
const { MAPS } = mod

// 图例：kind → 字符
const KIND_CHAR = {
  tree: "T", boulder: "R", vinewall: "V", pillar: "P", altar: "A", cage: "C",
  prismBig: "G", obelisk: "O", ring: "N", reef: "F", wreck: "K", anemone: "H",
  pond: "W", brambles: "X", lavacrack: "L", rubble: "D", crystal: "Y", voidpit: "o",
  sandbank: "U", kelpfield: "Z",
}
const MOTION_CHAR = { pulse: "1", gate: "2", patrol: "3", drift: "4" }

function genLayout(map) {
  const g = Array.from({ length: map.grid.h }, () => Array(map.grid.w).fill("."))
  const marks = (cells, ch) => cells.forEach((c) => { g[c.y][c.x] = ch })
  marks([map.spawn], "S")
  for (const e of map.entities) {
    for (const s of e.shape) {
      const x = e.origin.x + s.x
      const y = e.origin.y + s.y
      g[y][x] = KIND_CHAR[e.kind] ?? "?"
    }
  }
  for (const d of map.dynamicObstacles) g[d.cell.y][d.cell.x] = MOTION_CHAR[d.motion] ?? "5"
  for (const c of map.staticObstacles) if (g[c.y][c.x] === ".") g[c.y][c.x] = "#"
  return g.map((row) => row.join("")).join("\n")
}

const motionNames = { pulse: "藤蔓柱(呼吸)", gate: "闸门(开合)", patrol: "棱柱(巡逻)", drift: "漂移" }

let doc = `# 11 · 地图布局图（48×36 网格）

> 由 \`scripts/gen-layout.mjs\` 从地图数据自动生成——**图与数据永远一致**。
> 图例：\`S\` 出生点 ｜ \`#\` 墙 ｜ 大写字母=实体障碍 ｜ 小写/字母=地形 ｜ \`1~4\`=动态障碍（按类型）
> 实体图例：T树 R巨石 V藤蔓墙 P石柱 A祭坛 C铁笼 G大棱柱 O方尖碑 N环形门 F珊瑚礁 K沉船 H海葵
> 地形图例：W水塘 X荆棘 L熔岩 D碎石 Y水晶 o虚空坑 U沙洲 Z海藻林

`

for (const map of MAPS) {
  doc += `## ${map.name}（${map.id}）\n\n`
  doc += "```\n" + genLayout(map) + "\n```\n\n"
  // 元素统计
  const kinds = {}
  for (const e of map.entities) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1
  const dyn = {}
  for (const d of map.dynamicObstacles) dyn[d.motion] = (dyn[d.motion] ?? 0) + 1
  doc += `- 实体：${Object.entries(kinds).map(([k, n]) => `${KIND_CHAR[k]}×${n}`).join("、")}\n`
  doc += `- 动态：${Object.entries(dyn).map(([k, n]) => `${motionNames[k] ?? k}×${n}`).join("、")}\n`
  doc += `- 出生点：P1 (${map.spawn.x},${map.spawn.y})；P2 (${map.grid.w - 3},${map.grid.h - 3})\n\n`
}

doc += `> 布局原则（docs/09 延续）：丛林=均匀散布+中央留空；地牢=走廊式迷宫；几何=中心对称；深海=边缘为主。\n`
fs.writeFileSync("docs/11-地图布局图.md", doc, "utf8")
console.log("已生成 docs/11-地图布局图.md")
