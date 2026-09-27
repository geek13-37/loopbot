/** Мини-разметка для текстов уроков: **жирный** и `код` */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <b key={i} className="text-indigo-700">{p.slice(2, -2)}</b>
        if (p.startsWith('`')) return <code key={i} className="rounded bg-slate-100 px-1 text-fuchsia-700">{p.slice(1, -1)}</code>
        return p
      })}
    </>
  )
}
