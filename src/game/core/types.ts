// ============================================================
// core/types.ts —— 基础类型（全项目共享，禁止跨层复制定义）
// docs/04 架构设计 · 阶段 0 契约
// ============================================================

/** 网格坐标（列, 行） */
export interface Cell {
  x: number
  y: number
}

/** 方向 */
export type Direction = "up" | "down" | "left" | "right"

/** 玩家编号 */
export type PlayerId = 1 | 2

/** 游戏模式 */
export type GameMode = "solo" | "coop"

/** 难度档位 */
export type Difficulty = "casual" | "normal" | "hard"

/** 动态障碍运动类型（docs/02 第 6 节） */
export type ObstacleMotion = "pulse" | "patrol" | "gate" | "drift"

/** 动态障碍（docs/02 第 6 节） */
export interface DynamicObstacle {
  cell: Cell
  motion: ObstacleMotion
  params: {
    range: number // 幅度（格）
    speed: number // 周期（秒）
    phase: number // 初始相位 0~2π
  }
  /** 巡逻路径终点（仅 patrol 使用）；缺省 = 沿 motion 方向往返 */
  target?: Cell
}

/** 复合障碍物形态（docs/09：多格整体障碍，2~3 种/图） */
export type ObstacleKind =
  | "tree"        // 大树 2×2（丛林）
  | "boulder"     // 巨石 2×1（丛林）
  | "vinewall"    // 藤蔓墙 3×1（丛林）
  | "pillar"      // 石柱 1×2（地牢）
  | "altar"       // 祭坛 2×2（地牢）
  | "cage"        // 铁笼 2×2（地牢）
  | "prismBig"    // 大型棱柱 2×2（几何）
  | "obelisk"     // 方尖碑 1×2（几何）
  | "ring"        // 环形门 3×2（几何）
  | "reef"        // 珊瑚礁 2×2（深海）
  | "wreck"       // 沉船残骸 3×2（深海）
  | "anemone"     // 海葵丛 2×1（深海）

/** 复合障碍物实体：由多个格子组成一个整体（docs/09 网格升级需求） */
export interface ObstacleEntity {
  id: string
  kind: ObstacleKind
  origin: Cell // 锚点（左上角）
  /** 相对 origin 的占格（含 {0,0}），构成整体形状 */
  shape: Cell[]
}

/** 地图数据（纯数据，不包含任何绘制信息，docs/02 第 7 节） */
export interface MapData {
  id: string
  name: string
  grid: { w: number; h: number }
  spawn: { x: number; y: number }
  staticObstacles: Cell[]
  /** 复合障碍物（多格整体，docs/09：每图 2~3 种形态） */
  entities: ObstacleEntity[]
  dynamicObstacles: DynamicObstacle[]
  themeId: string
  decorSeed: number
}

/** 地图主题（纯数据，docs/02 第 4 节 + docs/09 定案） */
export interface Theme {
  id: string
  palette: {
    bg: string
    grid: string
    border: string
    accent: string
    food: string
    snakeA: string
    snakeB: string
    obstacle: string
    outline: string
    uiText: string
  }
  shadow: { offset: number; color: string }
  radius: number
  texture: {
    base: "leaf" | "stone" | "gradient" | "wave"
    dither: boolean
    ao: number
  }
  bgDecor: DecorSpec[]
  parallax: { layers: number; depth: number }
  obstacleStyle: "vine" | "stone" | "prism" | "coral"
  snakeStyle: {
    pattern: "stripe" | "scale" | "block" | "gradient"
    head: "cat" | "dragon" | "robot" | "fish"
  }
  anim: {
    eatParticle: "leaf" | "ember" | "shard" | "bubble"
    dur: number
  }
  foodStyle: "berry" | "gold" | "energy" | "pearl" // docs/09 食物造型
  audio: {
    bgm: { tempo: number; scale: string }
    ambient: "insects" | "dungeon" | "pulse" | "abyss"
  }
}

/** 背景装饰元素规格 */
export interface DecorSpec {
  kind: "firefly" | "leaf" | "light" | "torch" | "dust" | "bat" | "geo" | "orbit" | "bubble" | "kelp" | "plankton"
  count: number
  periodMin: number // 秒
  periodMax: number // 秒
}

/** 蛇的子状态（docs/03 第 5 节） */
export type SnakePhase = "alive" | "ghost" | "invincible"

/** 蛇运行时状态（逻辑层持有） */
export interface SnakeState {
  player: PlayerId
  body: Cell[] // body[0] = 头
  dir: Direction
  nextDir: Direction // 已应用的转向（插值用）
  phase: SnakePhase
  phaseTimer: number // ghost 10s / invincible 2s 剩余
  growPending: number // 待增长节数
  inputBuffer: Direction[] // 2 帧输入缓冲
}

/** 引擎状态机（docs/03 第 6 节） */
export type EngineState =
  | "idle"
  | "countdown"
  | "playing"
  | "paused"
  | "gameover"

/** 引擎事件（向外流出的唯一通道，docs/04 第 5 节） */
export type GameEvent =
  | { type: "state"; state: EngineState }
  | { type: "eat"; cell: Cell; player: PlayerId }
  | { type: "score"; player: PlayerId; score: number; combo: number; multiplier: number }
  | { type: "death"; player: PlayerId; reason: string }
  | { type: "revive"; player: PlayerId }
  | { type: "reviveCountdown"; player: PlayerId; remaining: number }
  | { type: "gameover"; winner?: PlayerId | "draw" }
  | { type: "tick" } // 逻辑 tick（调试/音效用）

/** 引擎对外命令口（React 唯一入口，docs/04 第 5 节） */
export interface EngineAPI {
  start(mapId: string, mode: GameMode, difficulty: Difficulty): void
  pause(): void
  resume(): void
  restart(): void
  destroy(): void
  on(handler: (e: GameEvent) => void): () => void
}

/** 难度预设（docs/03 第 4 节，数值阶段 5 调优回填） */
export interface DifficultyPreset {
  id: Difficulty
  label: string
  initialSpeed: number // 格/秒
  accelPerFood: number // 每吃 N 个加速一档
  accelStep: number // 每次加速的格/秒增量
  maxSpeed: number // 封顶
}
