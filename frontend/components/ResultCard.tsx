type ResultCardProps = {
  title: string
  content: string
}

export default function ResultCard({ title, content }: ResultCardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="small">{content}</p>
    </div>
  )
}
