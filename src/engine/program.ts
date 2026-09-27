import type { Block, BlockKind, LoopBlock } from './types'

export const ROOT = 'root'

let counter = 0
export const newId = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`

export function createBlock(kind: BlockKind): Block {
  const id = newId()
  if (kind === 'repeat') return { id, kind, times: 3, body: [] }
  if (kind === 'while') return { id, kind, cond: 'pathAhead', body: [] }
  return { id, kind }
}

const hasBody = (b: Block): b is LoopBlock => 'body' in b

function mapTree(blocks: Block[], fn: (b: Block) => Block | null): Block[] {
  const out: Block[] = []
  for (const b of blocks) {
    const mapped = fn(b)
    if (!mapped) continue
    out.push(hasBody(mapped) ? { ...mapped, body: mapTree(mapped.body, fn) } : mapped)
  }
  return out
}

export function addBlock(program: Block[], targetId: string, block: Block): Block[] {
  if (targetId === ROOT) return [...program, block]
  return mapTree(program, (b) => (b.id === targetId && hasBody(b) ? { ...b, body: [...b.body, block] } : b))
}

export function removeBlock(program: Block[], id: string): Block[] {
  return mapTree(program, (b) => (b.id === id ? null : b))
}

export function updateBlock(program: Block[], id: string, patch: Partial<Block>): Block[] {
  return mapTree(program, (b) => (b.id === id ? ({ ...b, ...patch } as Block) : b))
}

export function findBlock(program: Block[], id: string): Block | undefined {
  for (const b of program) {
    if (b.id === id) return b
    if (hasBody(b)) {
      const found = findBlock(b.body, id)
      if (found) return found
    }
  }
}

export function countBlocks(program: Block[]): number {
  return program.reduce((n, b) => n + 1 + (hasBody(b) ? countBlocks(b.body) : 0), 0)
}

/** Тот же алгоритм в виде кода на Python — чтобы связать блоки с «настоящим» программированием */
export function toPython(program: Block[], indent = ''): string {
  if (program.length === 0) return `${indent}pass`
  return program
    .map((b) => {
      switch (b.kind) {
        case 'forward':
          return `${indent}forward()`
        case 'left':
          return `${indent}turn_left()`
        case 'right':
          return `${indent}turn_right()`
        case 'repeat':
          return `${indent}for i in range(${b.times}):\n${toPython(b.body, indent + '    ')}`
        case 'while':
          return `${indent}while ${b.cond === 'pathAhead' ? 'path_ahead()' : 'not at_finish()'}:\n${toPython(b.body, indent + '    ')}`
      }
    })
    .join('\n')
}

// Короткие конструкторы для описания уроков
export const fwd = (): Block => createBlock('forward')
export const left = (): Block => createBlock('left')
export const right = (): Block => createBlock('right')
export const rep = (times: number, ...body: Block[]): Block => ({ id: newId(), kind: 'repeat', times, body })
export const whilePath = (...body: Block[]): Block => ({ id: newId(), kind: 'while', cond: 'pathAhead', body })
export const whileNotFinish = (...body: Block[]): Block => ({ id: newId(), kind: 'while', cond: 'notFinish', body })
