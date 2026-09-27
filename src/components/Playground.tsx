import { useEffect, useMemo, useState } from 'react'
import type { Block, BlockKind, Outcome, RunResult } from '../engine/types'
import { execute } from '../engine/interpreter'
import { parseWorld } from '../engine/world'
import { addBlock, countBlocks, createBlock, findBlock, removeBlock, ROOT, toPython, updateBlock } from '../engine/program'
import { Grid } from './Grid'
import { BLOCK_META, ProgramView } from './ProgramView'

interface Props {
  maps: string[][]
  initialProgram?: Block[]
  editable?: boolean
  palette?: BlockKind[]
  maxBlocks?: number
  hint?: string
  onWin?: () => void
}

interface Playback {
  results: RunResult[]
  map: number
  frame: number
}

type Verdict = { ok: boolean; text: string }

function describe(outcome: Outcome): string {
  switch (outcome.status) {
    case 'win':
      return 'Робот на финише!'
    case 'crash':
      return 'Бум! Робот врезался в стену. Проверь, куда он смотрит перед шагом.'
    case 'notFinish':
      return 'Программа закончилась, а робот ещё не на финише.'
    case 'missedStars':
      return `Робот на финише, но собрал не все звёзды (осталось ${outcome.left}).`
    case 'tooLong':
      return 'Робот ходит по кругу — похоже, это бесконечный цикл!'
  }
}

/** Контейнер, в котором лежит блок (для кнопки «выйти из цикла») */
function parentOf(blocks: Block[], id: string, parent = ROOT): string | null {
  for (const b of blocks) {
    if (b.id === id) return parent
    if ('body' in b) {
      const found = parentOf(b.body, id, b.id)
      if (found) return found
    }
  }
  return null
}

export function Playground({ maps, initialProgram = [], editable, palette = [], maxBlocks, hint, onWin }: Props) {
  const worlds = useMemo(() => maps.map(parseWorld), [maps])
  const [program, setProgram] = useState<Block[]>(initialProgram)
  const [target, setTarget] = useState(ROOT)
  const [viewMap, setViewMap] = useState(0)
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [fast, setFast] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const blocks = countBlocks(program)
  const overLimit = maxBlocks !== undefined && blocks > maxBlocks
  const running = playback !== null && verdict === null

  // Покадровое проигрывание результата
  useEffect(() => {
    if (!playback || verdict) return
    const { results, map, frame } = playback
    const current = results[map]
    const delay = fast ? 160 : 380

    if (frame < current.frames.length - 1) {
      const t = setTimeout(() => setPlayback({ ...playback, frame: frame + 1 }), delay)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      const prefix = maps.length > 1 ? `Поле ${map + 1}: ` : ''
      if (current.outcome.status !== 'win') {
        setVerdict({ ok: false, text: prefix + describe(current.outcome) })
      } else if (map < results.length - 1) {
        setViewMap(map + 1)
        setPlayback({ ...playback, map: map + 1, frame: 0 })
      } else if (overLimit) {
        setVerdict({
          ok: false,
          text: `Робот дошёл, но в программе ${blocks} блоков, а можно не больше ${maxBlocks}. Сделай короче с помощью цикла!`,
        })
      } else {
        setVerdict({ ok: true, text: maps.length > 1 ? 'Программа работает на всех полях! 🎉' : 'Отлично, задание выполнено! 🎉' })
        onWin?.()
      }
    }, delay + 200)
    return () => clearTimeout(t)
  }, [playback, verdict, fast, maps.length, overLimit, blocks, maxBlocks, onWin])

  const run = () => {
    setVerdict(null)
    setViewMap(0)
    setPlayback({ results: worlds.map((w) => execute(program, w)), map: 0, frame: 0 })
  }

  const reset = () => {
    setPlayback(null)
    setVerdict(null)
  }

  const edit = (next: Block[]) => {
    reset()
    setProgram(next)
  }

  const add = (kind: BlockKind) => {
    const block = createBlock(kind)
    const t = findBlock(program, target) ? target : ROOT
    edit(addBlock(program, t, block))
    if ('body' in block) setTarget(block.id)
  }

  const remove = (id: string) => {
    const next = removeBlock(program, id)
    edit(next)
    if (target !== ROOT && !findBlock(next, target)) setTarget(ROOT)
  }

  const frame = playback
    ? playback.results[playback.map].frames[playback.frame]
    : { ...worlds[viewMap].start, angle: worlds[viewMap].start.dir * 90, collected: [], blockId: null }

  const targetBlock = target === ROOT ? null : findBlock(program, target)

  return (
    <div className="space-y-3">
      {maps.length > 1 && (
        <div className="flex gap-2 justify-center">
          {maps.map((_, i) => (
            <button
              key={i}
              disabled={running}
              onClick={() => {
                reset()
                setViewMap(i)
              }}
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                viewMap === i ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'
              }`}
            >
              Поле {i + 1}
            </button>
          ))}
        </div>
      )}

      <Grid world={worlds[viewMap]} frame={frame} fast={fast} />

      {verdict && (
        <div
          className={`rounded-2xl px-4 py-3 font-semibold animate-pop ${
            verdict.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {verdict.text}
        </div>
      )}

      <div className="flex gap-2">
        {running ? (
          <button onClick={reset} className="btn flex-1 bg-rose-500 text-white">
            ⏹ Стоп
          </button>
        ) : (
          <button onClick={run} disabled={program.length === 0} className="btn flex-1 bg-emerald-500 text-white">
            ▶ Запустить
          </button>
        )}
        <button onClick={reset} disabled={!playback} className="btn bg-white text-slate-700" aria-label="Вернуть робота">
          ↺
        </button>
        <button onClick={() => setFast(!fast)} className="btn bg-white text-slate-700" aria-label="Скорость">
          {fast ? '🐇' : '🐢'}
        </button>
      </div>

      {editable && (
        <div className="rounded-2xl bg-white p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Добавить в:{' '}
              <b className="text-slate-800">
                {targetBlock ? `${BLOCK_META[targetBlock.kind].icon} ${BLOCK_META[targetBlock.kind].label}` : 'программу'}
              </b>
            </span>
            {targetBlock && (
              <button
                onClick={() => setTarget(parentOf(program, target) ?? ROOT)}
                className="text-indigo-600 font-semibold"
              >
                ⤴ выйти из цикла
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {palette.map((kind) => (
              <button
                key={kind}
                disabled={running}
                onClick={() => add(kind)}
                className={`${BLOCK_META[kind].color} rounded-xl py-2.5 text-white font-semibold active:scale-95 transition-transform disabled:opacity-50`}
              >
                {BLOCK_META[kind].icon} {BLOCK_META[kind].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="font-semibold text-slate-700">Программа</span>
          <span className="flex items-center gap-3">
            {maxBlocks !== undefined && (
              <span className={overLimit ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                блоков: {blocks} / {maxBlocks}
              </span>
            )}
            {editable && program.length > 0 && (
              <button
                disabled={running}
                onClick={() => {
                  edit([])
                  setTarget(ROOT)
                }}
                className="text-slate-400"
              >
                очистить
              </button>
            )}
          </span>
        </div>
        <ProgramView
          program={program}
          editable={editable && !running}
          activeId={playback ? playback.results[playback.map].frames[playback.frame].blockId : null}
          target={target}
          onSelectTarget={setTarget}
          onRemove={remove}
          onUpdate={(id, patch) => edit(updateBlock(program, id, patch))}
        />
      </div>

      <div className="flex gap-2 text-sm">
        {hint && (
          <button onClick={() => setShowHint(!showHint)} className="chip">
            💡 Подсказка
          </button>
        )}
        <button onClick={() => setShowCode(!showCode)} className="chip">
          🐍 Код на Python
        </button>
      </div>
      {showHint && hint && <p className="rounded-2xl bg-amber-50 text-amber-900 p-3 text-sm">{hint}</p>}
      {showCode && (
        <pre className="rounded-2xl bg-slate-900 text-emerald-300 p-3 text-sm overflow-x-auto">{toPython(program)}</pre>
      )}
    </div>
  )
}
