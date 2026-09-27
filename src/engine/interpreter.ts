import type { Block, Cond, Dir, Frame, Outcome, RunResult, World } from './types'
import { isBlocked, key } from './world'

const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

/** Сколько элементарных шагов разрешено, прежде чем считать цикл бесконечным */
export const MAX_OPS = 300

class Stop {
  constructor(public outcome: Outcome) {}
}

export function execute(program: Block[], world: World, maxOps = MAX_OPS): RunResult {
  let { x, y } = world.start
  let dir: Dir = world.start.dir
  let angle = dir * 90
  const collected = new Set<string>()
  let ops = 0

  const snapshot = (blockId: string | null, crash = false): Frame => ({
    x,
    y,
    angle,
    collected: [...collected],
    blockId,
    ...(crash ? { crash } : {}),
  })
  const frames: Frame[] = [snapshot(null)]

  const tick = () => {
    if (++ops > maxOps) throw new Stop({ status: 'tooLong' })
  }

  const check = (cond: Cond) => {
    if (cond === 'pathAhead') return !isBlocked(world, x + DX[dir], y + DY[dir])
    return !(x === world.finish.x && y === world.finish.y)
  }

  const run = (blocks: Block[]) => {
    for (const b of blocks) {
      switch (b.kind) {
        case 'forward': {
          tick()
          const nx = x + DX[dir]
          const ny = y + DY[dir]
          if (isBlocked(world, nx, ny)) {
            frames.push(snapshot(b.id, true))
            throw new Stop({ status: 'crash' })
          }
          x = nx
          y = ny
          if (world.stars.some((s) => s.x === x && s.y === y)) collected.add(key({ x, y }))
          frames.push(snapshot(b.id))
          break
        }
        case 'left':
        case 'right':
          tick()
          dir = ((dir + (b.kind === 'left' ? 3 : 1)) % 4) as Dir
          angle += b.kind === 'left' ? -90 : 90
          frames.push(snapshot(b.id))
          break
        case 'repeat':
          for (let i = 0; i < b.times; i++) {
            tick()
            run(b.body)
          }
          break
        case 'while':
          while (check(b.cond)) {
            tick()
            run(b.body)
          }
          break
      }
    }
  }

  try {
    run(program)
  } catch (e) {
    if (e instanceof Stop) return { frames, outcome: e.outcome }
    throw e
  }

  if (x !== world.finish.x || y !== world.finish.y) return { frames, outcome: { status: 'notFinish' } }
  const left = world.stars.length - collected.size
  if (left > 0) return { frames, outcome: { status: 'missedStars', left } }
  return { frames, outcome: { status: 'win' } }
}
