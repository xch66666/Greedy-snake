// ============================================================
// render/sprites.ts —— 素材贴图加载（docs/02 素材试点）
// Kenney CC0 roguelikeSheet（16×16 格），随 Vite 打包，boot 阶段预加载
// ============================================================
import sheetUrl from "../assets/sprites/roguelikeSheet.png"

const SHEETS: Record<string, string> = {
  roguelike: sheetUrl,
}

const loaded = new Map<string, HTMLImageElement>()

/** 预加载全部注册素材表（boot 资源清单调用，docs/05 第 3 节） */
export async function preloadSheets(onProgress?: (done: number, total: number) => void): Promise<void> {
  const entries = Object.entries(SHEETS)
  let done = 0
  await Promise.all(
    entries.map(([id, url]) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          loaded.set(id, img)
          done++
          onProgress?.(done, entries.length)
          resolve()
        }
        img.onerror = () => {
          console.warn(`[sprites] 素材加载失败，使用程序化绘制: ${id}`)
          done++
          onProgress?.(done, entries.length)
          resolve()
        }
        img.src = url
      }),
    ),
  )
}

/** 获取已加载素材表（未加载返回 null → 调用方回退程序化绘制） */
export function getSheet(id: string): HTMLImageElement | null {
  return loaded.get(id) ?? null
}

/** 从素材表裁切 16×16 瓦片到目标画布 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  tx: number,
  ty: number,
  dx: number,
  dy: number,
): void {
  ctx.drawImage(sheet, tx * 16, ty * 16, 16, 16, dx, dy, 16, 16)
}
