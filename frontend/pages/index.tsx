import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const trimmedQuestion = question.trim()

  const handleStart = () => {
    if (!trimmedQuestion) {
      setError('请输入占卜问题')
      return
    }
    setError('')
    void router.push({ pathname: '/divination', query: { q: trimmedQuestion } })
  }

  return (
    <main className="container">
      <div className="stack">
        <header className="stack">
          <h1>AI 六爻占卜</h1>
          <p className="small">输入问题，开始起卦。结果仅供娱乐参考。</p>
        </header>

        <section className="card stack">
          <label htmlFor="question">占卜问题</label>
          <input
            id="question"
            className="input"
            placeholder="例如：下个月的工作走势如何？"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value)
              if (error) setError('')
            }}
          />
          {error ? <p className="small">{error}</p> : null}
          <div className="row">
            <button className="button" onClick={handleStart} disabled={!trimmedQuestion}>
              开始占卜
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
