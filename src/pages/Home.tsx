import { Link } from 'react-router-dom'
import { lessons } from '../content/lessons'
import { useProgress } from '../store/progress'
import { Robot } from '../components/Robot'

export function Home() {
  const { done, reset } = useProgress()
  const doneCount = lessons.filter((l) => done[l.id]).length
  const allDone = doneCount === lessons.length
  const nextIdx = lessons.findIndex((l) => !done[l.id])

  return (
    <div className="page">
      <header className="flex items-center gap-3 pt-2">
        <Robot className="w-16 h-16 animate-float" />
        <div>
          <h1 className="text-2xl font-extrabold text-indigo-900">LoopBot</h1>
          <p className="text-slate-600 text-sm">Научи робота циклам — и научишься сам</p>
        </div>
      </header>

      <div className="mt-5">
        <div className="flex justify-between text-sm font-semibold text-slate-600 mb-1">
          <span>Маршрут «Циклы»</span>
          <span>
            {doneCount} / {lessons.length}
          </span>
        </div>
        <div className="h-3 rounded-full bg-indigo-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-700"
            style={{ width: `${(doneCount / lessons.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="relative mt-6 space-y-4">
        <div className="absolute left-8 top-8 bottom-8 w-1 bg-indigo-200 rounded" aria-hidden />
        {lessons.map((lesson, i) => {
          const isDone = done[lesson.id]
          const locked = !isDone && i > 0 && !done[lessons[i - 1].id]
          const isNext = i === nextIdx
          const card = (
            <div
              className={`relative flex items-center gap-4 rounded-3xl p-4 shadow-sm transition-transform ${
                locked ? 'bg-slate-100 opacity-60' : 'bg-white active:scale-[.98]'
              } ${isNext ? 'ring-4 ring-indigo-300' : ''}`}
            >
              <div
                className={`w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-2xl ${
                  isDone ? 'bg-emerald-100' : locked ? 'bg-slate-200' : 'bg-indigo-100'
                }`}
              >
                {locked ? '🔒' : isDone ? '✅' : lesson.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Урок {i + 1}</p>
                <p className="font-bold text-slate-900">{lesson.title}</p>
                <p className="text-sm text-slate-500">{lesson.subtitle}</p>
              </div>
            </div>
          )
          return <li key={lesson.id}>{locked ? card : <Link to={`/lesson/${lesson.id}`}>{card}</Link>}</li>
        })}
      </ol>

      {allDone ? (
        <div className="mt-6 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 p-5 text-center shadow animate-pop">
          <div className="text-5xl">🏆</div>
          <p className="mt-2 text-xl font-extrabold text-amber-950">Маршрут пройден!</p>
          <p className="text-amber-900 text-sm mt-1">
            Ты знаешь циклы «повтори», вложенные циклы и цикл «пока» — те же, что в Python, JavaScript и других языках.
          </p>
          <button onClick={reset} className="mt-3 text-sm font-semibold text-amber-950 underline">
            Пройти заново
          </button>
        </div>
      ) : (
        <Link to={`/lesson/${lessons[nextIdx].id}`} className="btn mt-6 block text-center bg-indigo-600 text-white text-lg">
          {doneCount === 0 ? 'Начать 🚀' : 'Продолжить →'}
        </Link>
      )}
    </div>
  )
}
