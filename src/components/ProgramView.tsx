import type { Block, BlockKind, Cond } from '../engine/types'
import { ROOT } from '../engine/program'

export const BLOCK_META: Record<BlockKind, { label: string; icon: string; color: string }> = {
  forward: { label: 'вперёд', icon: '⬆️', color: 'bg-sky-500' },
  left: { label: 'налево', icon: '↩️', color: 'bg-sky-500' },
  right: { label: 'направо', icon: '↪️', color: 'bg-sky-500' },
  repeat: { label: 'повтори', icon: '🔁', color: 'bg-orange-500' },
  while: { label: 'пока', icon: '❓', color: 'bg-fuchsia-600' },
}

export const COND_LABEL: Record<Cond, string> = {
  pathAhead: 'впереди свободно',
  notFinish: 'не на финише',
}

interface Props {
  program: Block[]
  editable?: boolean
  activeId?: string | null
  target?: string
  onSelectTarget?: (id: string) => void
  onRemove?: (id: string) => void
  onUpdate?: (id: string, patch: Partial<Block>) => void
}

export function ProgramView(props: Props) {
  const { program, editable, target, onSelectTarget } = props
  const rootSelected = editable && target === ROOT

  return (
    <div
      onClick={() => editable && onSelectTarget?.(ROOT)}
      className={`min-h-24 rounded-2xl border-2 border-dashed p-2 space-y-1.5 transition-colors ${
        rootSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
    >
      {program.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-6">
          {editable ? 'Нажимай на блоки снизу, чтобы собрать программу' : 'Пустая программа'}
        </p>
      )}
      <BlockList blocks={program} {...props} />
    </div>
  )
}

function BlockList({ blocks, ...props }: Props & { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b) => (
        <BlockItem key={b.id} block={b} {...props} />
      ))}
    </>
  )
}

function BlockItem({ block, ...props }: Props & { block: Block }) {
  const { editable, activeId, target, onSelectTarget, onRemove, onUpdate } = props
  const meta = BLOCK_META[block.kind]
  const active = activeId === block.id
  const ring = active ? 'ring-4 ring-yellow-300 scale-[1.02]' : ''

  const removeBtn = editable && (
    <button
      aria-label="Удалить блок"
      onClick={(e) => {
        e.stopPropagation()
        onRemove?.(block.id)
      }}
      className="ml-auto w-7 h-7 shrink-0 rounded-full bg-black/20 text-white leading-none active:bg-black/40"
    >
      ×
    </button>
  )

  if (block.kind !== 'repeat' && block.kind !== 'while') {
    return (
      <div
        className={`${meta.color} ${ring} flex items-center gap-2 rounded-xl px-3 py-2 text-white font-semibold shadow-sm transition-transform`}
      >
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        {removeBtn}
      </div>
    )
  }

  const selected = editable && target === block.id
  const border = block.kind === 'repeat' ? 'border-orange-500' : 'border-fuchsia-600'

  return (
    <div
      className={`rounded-xl overflow-hidden transition-transform ${ring} ${
        selected ? 'outline-3 outline-indigo-500 outline-offset-2' : ''
      }`}
      onClick={(e) => {
        if (!editable) return
        e.stopPropagation()
        onSelectTarget?.(block.id)
      }}
    >
      <div className={`${meta.color} flex items-center gap-2 px-3 py-2 text-white font-semibold`}>
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        {block.kind === 'repeat' ? (
          <>
            {editable && (
              <Stepper label="−" onClick={() => onUpdate?.(block.id, { times: Math.max(1, block.times - 1) })} />
            )}
            <span className="min-w-6 text-center text-lg bg-white/25 rounded-md px-1">{block.times}</span>
            {editable && (
              <Stepper label="+" onClick={() => onUpdate?.(block.id, { times: Math.min(20, block.times + 1) })} />
            )}
            <span>раз</span>
          </>
        ) : (
          <button
            disabled={!editable}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate?.(block.id, { cond: block.cond === 'pathAhead' ? 'notFinish' : 'pathAhead' })
            }}
            className="rounded-md bg-white/25 px-2 py-0.5 text-sm"
          >
            {COND_LABEL[block.cond]} {editable && '⇄'}
          </button>
        )}
        {removeBtn}
      </div>
      <div className={`border-l-[14px] ${border} bg-slate-50 p-1.5 space-y-1.5`}>
        {block.body.length === 0 ? (
          <p className="text-slate-400 text-sm px-2 py-2">
            {selected ? 'Добавляй блоки — они попадут сюда' : editable ? 'Нажми, чтобы добавить блоки внутрь' : '—'}
          </p>
        ) : (
          <BlockList blocks={block.body} {...props} />
        )}
      </div>
    </div>
  )
}

function Stepper({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="w-7 h-7 rounded-full bg-white/30 text-lg leading-none active:bg-white/50"
    >
      {label}
    </button>
  )
}
