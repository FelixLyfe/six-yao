import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CoinAnimation from '../components/CoinAnimation'
import HexagramView from '../components/HexagramView'
import {
  buildDivinationResult,
  generateLines,
  toDisplayLines,
  type LineValue
} from '../lib/liuyao'

const ROLLING_DURATION_MS = 1800
const ROLLING_TICK_MS = 120

export default function Divination() {
  const router = useRouter()
  const question = typeof router.query.q === 'string' ? router.query.q : ''
  const hasQuestion = Boolean(question.trim())
  const [lines, setLines] = useState<LineValue[]>([])
  const [previewLines, setPreviewLines] = useState<LineValue[]>([])
  const [rolling, setRolling] = useState(false)

  const canFinish = lines.length === 6 && !rolling

  useEffect(() => {
    if (!rolling) return
    const interval = setInterval(() => {
      setPreviewLines(generateLines())
    }, ROLLING_TICK_MS)
    const timer = setTimeout(() => {
      const finalLines = generateLines()
      setLines(finalLines)
      setPreviewLines([])
      setRolling(false)
    }, ROLLING_DURATION_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [rolling])

  const handleRoll = () => {
    if (rolling || !hasQuestion) return
    setLines([])
    setPreviewLines(generateLines())
    setRolling(true)
  }

  const handleFinish = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!canFinish) {
      event.preventDefault()
      return
    }
    const result = buildDivinationResult(question, lines)
    sessionStorage.setItem('liuyao:last', JSON.stringify(result))
  }

  const displayLines = useMemo(() => {
    if (lines.length === 6) return toDisplayLines(lines)
    if (previewLines.length === 6) return toDisplayLines(previewLines)
    return []
  }, [lines, previewLines])
  const statusText = rolling ? '起卦进行中…' : lines.length === 6 ? '已完成' : '等待开始'

  return (
    <main className="container">
      <div className="stack">
        <header className="stack">
          <h1>起卦</h1>
          <p className="small">问题：{question || '未填写'}</p>
          {!hasQuestion ? <p className="small">请返回首页输入占卜问题。</p> : null}
        </header>

        <CoinAnimation status={statusText} rolling={rolling} />

        <HexagramView
          title="当前爻象"
          lines={displayLines}
          isRolling={rolling}
          emptyText="点击开始起卦以生成六爻"
        />

        <div className="row">
          <button className="button" onClick={handleRoll} disabled={rolling || !hasQuestion}>
            开始起卦
          </button>
          <Link
            className={`button secondary ${canFinish ? '' : 'disabled'}`}
            href={{ pathname: '/result', query: question ? { q: question } : undefined }}
            aria-disabled={!canFinish}
            onClick={handleFinish}
          >
            查看结果
          </Link>
        </div>
        <p className="small">提示：一次性投掷六爻，完成后可查看结果。</p>
      </div>
    </main>
  )
}
