import { useCallback, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getLesson, lessons, type Step } from '../content/lessons'
import { useProgress } from '../store/progress'
import { Playground } from '../components/Playground'
import { RichText } from '../components/RichText'
import { Robot } from '../components/Robot'

/** key по id — при переходе к следующему уроку состояние шагов сбрасывается само */
export function LessonRoute() {
  const { id = '' } = useParams()
  return <Lesson key={id} id={id} />
}

function Lesson({ id }: { id: string }) {
  const lesson = getLesson(id)
  const [stepIdx, setStepIdx] = useState(0)
  const [passed, setPassed] = useState<Record<number, boolean>>({})
  const [finished, setFinished] = useState(false)
  const markDone = useProgress((s) => s.markDone)
  const navigate = useNavigate()
  const pass = useCallback(() => setPassed((p) => ({ ...p, [stepIdx]: true })), [stepIdx])

  if (!lesson) return <Navigate to="/" replace />

  const step = lesson.steps[stepIdx]
  const canGoNext = step.type === 'theory' || step.type === 'example' || passed[stepIdx]
  const lessonNum = lessons.indexOf(lesson)
  const nextLesson = lessons[lessonNum + 1]

  const next = () => {
    if (stepIdx < lesson.steps.length - 1) {
      setStepIdx(stepIdx + 1)
      window.scrollTo({ top: 0 })
    } else {
      markDone(lesson.id)
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div className="page flex flex-col items-center justify-center text-center min-h-dvh">
        <div className="text-6xl animate-pop">🎉</div>
        <Robot className="w-28 h-28 mt-4 animate-float" />
        <h1 className="mt-4 text-2xl font-extrabold text-indigo-900">Урок «{lesson.title}» пройден!</h1>
        <p className="mt-2 text-slate-600">Робот стал умнее. И ты тоже 😉</p>
        <div className="mt-8 w-full space-y-3">
          {nextLesson && (
            <button
              onClick={() => navigate(`/lesson/${nextLesson.id}`)}
              className="btn w-full bg-indigo-600 text-white text-lg"
            >
              Следующий урок: {nextLesson.title} →
            </button>
          )}
          <Link to="/" className="btn block w-full bg-white text-indigo-700">
            К карте маршрута
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page pb-28">
      <header className="flex items-center gap-3 sticky top-0 z-10 -mx-4 px-4 py-2 bg-indigo-50/90 backdrop-blur">
        <Link to="/" className="w-10 h-10 grid place-items-center rounded-full bg-white shadow-sm" aria-label="Назад">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-indigo-500">
            Урок {lessonNum + 1} · {lesson.title}
          </p>
          <div className="flex gap-1 mt-1">
            {lesson.steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < stepIdx ? 'bg-indigo-500' : i === stepIdx ? 'bg-indigo-300' : 'bg-indigo-100'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div key={`${lesson.id}-${stepIdx}`} className="mt-3 animate-slide">
        <StepView step={step} onPass={pass} />
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-indigo-50 via-indigo-50 to-transparent">
        <button
          onClick={next}
          disabled={!canGoNext}
          className="btn w-full max-w-md mx-auto block bg-indigo-600 text-white text-lg"
        >
          {!canGoNext
            ? step.type === 'quiz'
              ? 'Выбери правильный ответ'
              : 'Выполни задание, чтобы продолжить'
            : stepIdx === lesson.steps.length - 1
              ? 'Завершить урок ✓'
              : 'Далее →'}
        </button>
      </div>
    </div>
  )
}

function StepView({ step, onPass }: { step: Step; onPass: () => void }) {
  switch (step.type) {
    case 'theory':
      return (
        <article className="space-y-3">
          <Tag>📖 Объяснение</Tag>
          <h2 className="text-2xl font-extrabold text-indigo-950">{step.title}</h2>
          {step.body.map((p, i) => (
            <p key={i} className="text-slate-700 leading-relaxed">
              <RichText text={p} />
            </p>
          ))}
          {step.code && <CodeCard code={step.code} />}
        </article>
      )
    case 'example':
      return (
        <section className="space-y-3">
          <Tag>👀 {step.title}</Tag>
          <p className="text-slate-700">
            <RichText text={step.text} />
          </p>
          <Playground maps={step.maps} initialProgram={step.program} />
        </section>
      )
    case 'quiz':
      return <Quiz step={step} onPass={onPass} />
    case 'practice':
      return (
        <section className="space-y-3">
          <Tag>🛠 Практика</Tag>
          <h2 className="text-xl font-extrabold text-indigo-950">{step.title}</h2>
          <p className="text-slate-700">
            <RichText text={step.text} />
          </p>
          <Playground
            maps={step.maps}
            editable
            palette={step.palette}
            maxBlocks={step.maxBlocks}
            hint={step.hint}
            onWin={onPass}
          />
        </section>
      )
  }
}

function Quiz({ step, onPass }: { step: Extract<Step, { type: 'quiz' }>; onPass: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const correct = picked === step.answer

  return (
    <section className="space-y-3">
      <Tag>🧠 Проверь себя</Tag>
      <h2 className="text-xl font-extrabold text-indigo-950">{step.question}</h2>
      {step.code && <CodeCard code={step.code} />}
      <div className="grid gap-2">
        {step.options.map((opt, i) => {
          const state =
            picked === null || (picked !== i && !(correct && i === step.answer))
              ? 'bg-white'
              : i === step.answer
                ? 'bg-emerald-100 ring-2 ring-emerald-400'
                : 'bg-rose-100 ring-2 ring-rose-300 animate-shake'
          return (
            <button
              key={i}
              disabled={correct}
              onClick={() => {
                setPicked(i)
                if (i === step.answer) onPass()
              }}
              className={`${state} rounded-2xl px-4 py-3 text-left font-semibold text-slate-800 shadow-sm active:scale-[.98] transition`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p
          className={`rounded-2xl p-3 animate-pop ${correct ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
        >
          {correct ? `Верно! ${step.explain}` : 'Не совсем. Подумай ещё раз 🙂'}
        </p>
      )}
    </section>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{children}</span>
}

function CodeCard({ code }: { code: string }) {
  return <pre className="rounded-2xl bg-slate-900 text-amber-200 p-4 text-[15px] leading-relaxed overflow-x-auto">{code}</pre>
}
