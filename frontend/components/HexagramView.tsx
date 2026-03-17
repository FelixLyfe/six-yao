type HexagramViewProps = {
  title: string
  lines: number[]
  isRolling?: boolean
  emptyText?: string
}

const lineLabel = (value: number) => {
  if (value === 6) return '老阴'
  if (value === 7) return '少阳'
  if (value === 8) return '少阴'
  return '老阳'
}

export default function HexagramView({ title, lines, isRolling, emptyText }: HexagramViewProps) {
  return (
    <div className={`card ${isRolling ? 'rolling' : ''}`}>
      <h3>{title}</h3>
      {lines.length === 0 ? (
        <p className="small">{emptyText || '等待起卦结果'}</p>
      ) : (
        <div className="stack">
          {lines.map((line, index) => (
            <div key={`${title}-${index}`} className="row">
              <span className="badge">{lineLabel(line)}</span>
              <span>第 {6 - index} 爻</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
