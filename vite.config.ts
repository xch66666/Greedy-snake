import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// GitHub Pages 子路径部署需要 base 配置（见 docs/08 已知坑 #3）
const repoBase = process.env.GH_PAGES === "1" ? "/Greedy-snake/" : "/"

export default defineConfig({
  plugins: [react()],
  base: repoBase,
  server: {
    port: 5173,
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 700,
  },
})
