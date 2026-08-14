// ============================================================
// ui/ErrorBoundary.tsx —— React 报错兜底（docs/05 第 4 节：不白屏）
// ============================================================
import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error("[ErrorBoundary]", error)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="overlay">
          <div className="modal px-card" style={{ alignItems: "center", gap: 12 }}>
            <div className="px-title" style={{ fontSize: 24 }}>出错了</div>
            <div style={{ fontSize: 12, opacity: 0.75, textAlign: "center", wordBreak: "break-all" }}>
              {this.state.error.message}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="px-btn" onClick={() => { this.setState({ error: null }); window.location.reload() }}>
                重新加载
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
