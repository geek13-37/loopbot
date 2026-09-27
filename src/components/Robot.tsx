/** Робот нарисован «лицом вверх»; направление задаётся поворотом снаружи */
export function Robot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="Робот">
      <path d="M50 4 L62 20 L38 20 Z" fill="#f59e0b" />
      <rect x="18" y="22" width="64" height="62" rx="20" fill="#6366f1" stroke="#312e81" strokeWidth="4" />
      <rect x="28" y="32" width="44" height="30" rx="10" fill="#e0e7ff" />
      <circle cx="41" cy="46" r="6" fill="#1e1b4b" />
      <circle cx="59" cy="46" r="6" fill="#1e1b4b" />
      <path d="M40 72 Q50 78 60 72" stroke="#e0e7ff" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
