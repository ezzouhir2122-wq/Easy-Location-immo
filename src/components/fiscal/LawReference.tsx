interface Props { article: string; note?: string }

export function LawReference({ article, note }: Props) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
      <span className="font-medium">{article}</span>
      {note && <span className="opacity-70">· {note}</span>}
    </span>
  )
}
