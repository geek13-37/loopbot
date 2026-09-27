/** 0 — вверх, 1 — вправо, 2 — вниз, 3 — влево */
export type Dir = 0 | 1 | 2 | 3

export type Cond = 'pathAhead' | 'notFinish'

export type Block =
  | { id: string; kind: 'forward' | 'left' | 'right' }
  | { id: string; kind: 'repeat'; times: number; body: Block[] }
  | { id: string; kind: 'while'; cond: Cond; body: Block[] }

export type BlockKind = Block['kind']
export type LoopBlock = Extract<Block, { body: Block[] }>

export interface Point {
  x: number
  y: number
}

export interface World {
  width: number
  height: number
  walls: boolean[][]
  stars: Point[]
  finish: Point
  start: Point & { dir: Dir }
}

/** Снимок состояния робота после очередного действия */
export interface Frame {
  x: number
  y: number
  /** накопленный угол поворота в градусах — чтобы анимация не крутилась «через 360» */
  angle: number
  collected: string[]
  blockId: string | null
  crash?: boolean
}

export type Outcome =
  | { status: 'win' }
  | { status: 'crash' }
  | { status: 'notFinish' }
  | { status: 'missedStars'; left: number }
  | { status: 'tooLong' }

export interface RunResult {
  frames: Frame[]
  outcome: Outcome
}
