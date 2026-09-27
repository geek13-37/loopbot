import type { Dir, Point, World } from './types'

const START_DIRS: Record<string, Dir> = { '^': 0, '>': 1, v: 2, '<': 3 }

/**
 * Карта задаётся строками:
 *   # — стена, . — пол, * — звезда, F — финиш,
 *   ^ > v < — старт робота и направление взгляда.
 */
export function parseWorld(rows: string[]): World {
  const height = rows.length
  const width = Math.max(...rows.map((r) => r.length))
  const walls: boolean[][] = []
  const stars: Point[] = []
  let finish: Point | null = null
  let start: (Point & { dir: Dir }) | null = null

  rows.forEach((row, y) => {
    walls.push([])
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '#'
      walls[y].push(ch === '#')
      if (ch === '*') stars.push({ x, y })
      if (ch === 'F') finish = { x, y }
      if (ch in START_DIRS) start = { x, y, dir: START_DIRS[ch] }
    }
  })

  if (!start || !finish) throw new Error('На карте должны быть старт и финиш')
  return { width, height, walls, stars, finish, start }
}

export const key = (p: Point) => `${p.x},${p.y}`

export function isBlocked(world: World, x: number, y: number) {
  return x < 0 || y < 0 || x >= world.width || y >= world.height || world.walls[y][x]
}
