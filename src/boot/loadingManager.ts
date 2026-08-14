// ============================================================
// boot/loadingManager.ts —— 资源清单加载（docs/05 第 3 节）
// 字体就绪后再进菜单；失败降级不阻塞（docs/05 第 4 节）
// ============================================================

/** 字体清单（Fusion Pixel 中文像素字体，CDN；失败回退系统字体） */
const FONT_URLS = [
  "https://cdn.jsdelivr.net/npm/fusion-pixel-12px-proportional-zh_hans@latest/dist/fusion-pixel-12px-proportional-zh_hans.woff2",
  "https://fastly.jsdelivr.net/npm/fusion-pixel-12px-proportional-zh_hans@latest/dist/fusion-pixel-12px-proportional-zh_hans.woff2",
]

export interface LoadProgress {
  /** 0..1 */
  progress: number
  label: string
}

export async function loadGameAssets(onProgress: (p: LoadProgress) => void): Promise<void> {
  onProgress({ progress: 0.1, label: "正在初始化…" })

  // 字体：注入 @font-face 并等待
  const fontPromise = loadFont(FONT_URLS[0]).catch(() => loadFont(FONT_URLS[1]).catch(() => false))
  const ready = await fontPromise
  onProgress({ progress: 0.6, label: ready ? "像素字体就绪" : "使用系统字体回退" })

  // 等待字体渲染就绪（避免 FOUT，docs/05 1.2）
  try {
    await document.fonts.ready
  } catch {
    /* 忽略 */
  }
  onProgress({ progress: 1, label: "完成" })
}

function loadFont(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const style = document.createElement("style")
    style.textContent = `
      @font-face {
        font-family: "Fusion Pixel";
        src: url("${url}") format("woff2");
        font-display: swap;
      }
    `
    document.head.appendChild(style)
    // 检测字体是否可用
    const probe = "像素贪吃蛇 0123456789"
    const check = (): void => {
      try {
        if (document.fonts.check('12px "Fusion Pixel"', probe)) {
          resolve(true)
        } else {
          resolve(false)
        }
      } catch {
        resolve(false)
      }
    }
    window.setTimeout(check, 3000) // 3s 超时 → 回退
  })
}
