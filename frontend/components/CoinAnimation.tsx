type CoinAnimationProps = {
  status: string
  rolling?: boolean
}

export default function CoinAnimation({ status, rolling }: CoinAnimationProps) {
  return (
    <div className={`card ${rolling ? 'rolling' : ''}`}>
      <div className="row">
        <span className="badge">起卦状态</span>
        <strong>{status}</strong>
      </div>
    </div>
  )
}
