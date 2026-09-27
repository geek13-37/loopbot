import type { Frame, World } from '../engine/types'
import { key } from '../engine/world'
import { Robot } from './Robot'

export function Grid({ world, frame, fast }: { world: World; frame: Frame; fast?: boolean }) {
  const { width, height } = world
  const cellW = 100 / width
  const cellH = 100 / height

  return (
    <div
      className="relative w-full max-h-[42vh] mx-auto rounded-2xl bg-indigo-100 p-1.5 shadow-inner"
      style={{ aspectRatio: `${width} / ${height}`, maxWidth: `min(100%, calc(42vh * ${width / height}))` }}
    >
      <div className="relative w-full h-full">
        {world.walls.map((row, y) =>
          row.map((wall, x) => (
            <div
              key={`${x},${y}`}
              className="absolute p-0.5"
              style={{ left: `${x * cellW}%`, top: `${y * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
            >
              <div
                className={`w-full h-full rounded-lg flex items-center justify-center ${
                  wall ? 'bg-slate-600 shadow-[inset_0_-4px_0_rgba(0,0,0,.25)]' : 'bg-white'
                }`}
              >
                {world.finish.x === x && world.finish.y === y && <span className="text-[min(6vw,1.8rem)]">🏁</span>}
                {world.stars.some((s) => s.x === x && s.y === y) && !frame.collected.includes(key({ x, y })) && (
                  <span className="text-[min(6vw,1.8rem)] animate-pulse">⭐</span>
                )}
              </div>
            </div>
          )),
        )}

        <div
          className={`absolute ease-in-out ${fast ? 'duration-150' : 'duration-300'} transition-[left,top] ${
            frame.crash ? 'animate-shake' : ''
          }`}
          style={{ left: `${frame.x * cellW}%`, top: `${frame.y * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
        >
          <div
            className={`w-full h-full p-[8%] transition-transform ${fast ? 'duration-150' : 'duration-300'}`}
            style={{ transform: `rotate(${frame.angle}deg)` }}
          >
            <Robot className="w-full h-full drop-shadow" />
          </div>
          {frame.crash && <span className="absolute -top-2 -right-1 text-xl">💥</span>}
        </div>
      </div>
    </div>
  )
}
