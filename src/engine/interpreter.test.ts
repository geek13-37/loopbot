import { describe, expect, it } from 'vitest'
import { execute } from './interpreter'
import { parseWorld } from './world'
import { countBlocks, fwd, left, rep, right, whileNotFinish, whilePath } from './program'
import { lessons } from '../content/lessons'
import type { Block } from './types'

describe('execute', () => {
  it('проходит коридор циклом', () => {
    const world = parseWorld(['>*.F'])
    expect(execute([rep(3, fwd())], world).outcome).toEqual({ status: 'win' })
  })

  it('врезается в стену', () => {
    const world = parseWorld(['>#F'])
    const r = execute([fwd()], world)
    expect(r.outcome.status).toBe('crash')
    expect(r.frames.at(-1)?.crash).toBe(true)
  })

  it('сообщает о несобранных звёздах', () => {
    const world = parseWorld(['.*', '^F'])
    expect(execute([right(), fwd()], world).outcome).toEqual({ status: 'missedStars', left: 1 })
  })

  it('ловит бесконечный цикл', () => {
    const world = parseWorld(['>.F'])
    expect(execute([whileNotFinish(left())], world).outcome.status).toBe('tooLong')
    expect(execute([whilePath()], world).outcome.status).toBe('tooLong')
  })
})

/** Эталонные решения: гарантируют, что каждое задание проходимо в пределах лимита блоков */
const solutions: Record<string, Block[]> = {
  'Задание 1. Длинный коридор': [rep(6, fwd())],
  'Задание 2. Лесенка': [rep(3, fwd(), left(), fwd(), right())],
  'Задание. Обход стены': [rep(3, rep(3, fwd()), right())],
  'Задание 1. Поворот': [whilePath(fwd()), right(), whilePath(fwd())],
  'Задание 2. Бесконечная лесенка': [whileNotFinish(fwd(), left(), fwd(), right())],
}

describe('уроки', () => {
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (step.type === 'example') {
        it(`пример «${lesson.title}» доходит до финиша`, () => {
          for (const rows of step.maps) expect(execute(step.program, parseWorld(rows)).outcome.status).toBe('win')
        })
      }
      if (step.type === 'practice') {
        it(`${lesson.title}: ${step.title} решается`, () => {
          const sol = solutions[step.title]
          expect(sol).toBeDefined()
          expect(countBlocks(sol)).toBeLessThanOrEqual(step.maxBlocks)
          for (const rows of step.maps) expect(execute(sol, parseWorld(rows)).outcome.status).toBe('win')
        })
      }
    }
  }
})
