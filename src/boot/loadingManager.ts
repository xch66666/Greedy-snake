// ============================================================
// boot/loadingManager.ts —— 资源加载（docs/05 第 3 节）
// 字体随 Vite 打包（本地），素材表预加载，渲染就绪后进菜单
// ============================================================
import { preloadSheets } from "../render/sprites"

/** 像素字体族名（src/ui/fonts.css 本地分片，docs/02 1.1 法则 5） */
export const PIXEL_FONT_FAMILY = "Fusion Pixel 12px Proportional"

export interface LoadProgress {
  /** 0..1 */
  progress: number
  label: string
}

export async function loadGameAssets(onProgress: (p: LoadProgress) => void): Promise<void> {
  onProgress({ progress: 0.1, label: "正在初始化…" })

  // 素材表预加载（Kenney CC0 tileset，docs/02 素材试点）
  await preloadSheets((done, total) => {
    onProgress({ progress: 0.15 + (done / total) * 0.35, label: `加载素材 ${done}/${total}` })
  })

  // 字体随 bundle 加载（本地打包，无 CDN 失败风险，docs/08 坑 #2 规避）
  const fontReady = document.fonts.check(`12px "${PIXEL_FONT_FAMILY}"`, "像素贪吃蛇 0123456789")
  onProgress({ progress: fontReady ? 0.8 : 0.5, label: fontReady ? "像素字体就绪" : "字体渲染中…" })

  // 等待字体渲染就绪（避免 FOUT，docs/05 1.2）
  try {
    await document.fonts.ready
  } catch {
    /* 忽略 */
  }
  onProgress({ progress: 1, label: "完成" })
}
