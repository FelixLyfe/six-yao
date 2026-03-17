import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import HexagramView from '../components/HexagramView'
import ResultCard from '../components/ResultCard'
import {
  toDisplayLines,
  type AiInterpretation,
  type DivinationResult,
  type HexagramInfo,
  type LineValue
} from '../lib/liuyao'

const placeholderLine: LineValue = 7

export default function Result() {
  const router = useRouter()
  const question = typeof router.query.q === 'string' ? router.query.q : ''
  const [result, setResult] = useState<DivinationResult | null>(null)
  const [aiResult, setAiResult] = useState<AiInterpretation | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiRequested, setAiRequested] = useState(false)
  const [aiNonce, setAiNonce] = useState(0)
  const [shareStatus, setShareStatus] = useState('')
  const [deepStatus, setDeepStatus] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787'

  useEffect(() => {
    const raw = sessionStorage.getItem('liuyao:last')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as DivinationResult
      setResult(parsed)
      setAiResult(parsed.aiResult ?? null)
    } catch {
      setResult(null)
    }
  }, [])

  useEffect(() => {
    if (!result || aiLoading || aiResult || aiRequested || aiError) return
    if (!result.lines || result.lines.length !== 6) return

    const controller = new AbortController()
    const run = async () => {
      setAiLoading(true)
      setAiRequested(true)
      setAiError('')
      try {
        const response = await fetch(`${apiBase}/api/divination`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: result.question, lines: result.lines }),
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`)
        }
        const data = (await response.json()) as {
          ai_result: AiInterpretation | null
          ai_error?: string | null
          hexagram: HexagramInfo | null
          changed_hexagram: HexagramInfo | null
        }
        setAiResult(data.ai_result ?? null)
        if (data.ai_error) setAiError(data.ai_error)
        setResult((prev) =>
          prev
            ? {
                ...prev,
                hexagram: data.hexagram ?? prev.hexagram,
                changedHexagram: data.changed_hexagram ?? prev.changedHexagram,
                aiResult: data.ai_result ?? prev.aiResult
              }
            : prev
        )
        const raw = sessionStorage.getItem('liuyao:last')
        if (raw) {
          const updated = {
            ...(JSON.parse(raw) as DivinationResult),
            hexagram: data.hexagram ?? result.hexagram,
            changedHexagram: data.changed_hexagram ?? result.changedHexagram,
            aiResult: data.ai_result ?? result.aiResult
          }
          sessionStorage.setItem('liuyao:last', JSON.stringify(updated))
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setAiError(error instanceof Error ? error.message : 'AI 请求失败')
      } finally {
        setAiLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [apiBase, aiLoading, aiResult, aiError, aiNonce, aiRequested, result])

  const baseLines = result?.lines ?? []
  const changedLines = result?.changedLines ?? []
  const baseInfo = result?.hexagram ?? null
  const changedInfo = result?.changedHexagram ?? null

  const displayBase = toDisplayLines(baseLines, placeholderLine)
  const displayChanged = toDisplayLines(changedLines, placeholderLine)

  const movingText = result?.movingLines?.length
    ? result.movingLines.map((line) => `第${line}爻`).join('、')
    : '无动爻'

  const resolvedAi = aiResult ?? result?.aiResult ?? null
  const fallbackText = aiError ? 'AI 暂不可用，请检查 OPENAI_API_KEY。' : '等待 AI 解读输出。'
  const meaningText = resolvedAi?.meaning || (aiLoading ? 'AI 解读生成中…' : fallbackText)
  const trendText = resolvedAi?.trend || (aiLoading ? 'AI 解读生成中…' : fallbackText)
  const riskText = resolvedAi?.risk || (aiLoading ? 'AI 解读生成中…' : fallbackText)
  const adviceText = resolvedAi?.advice || (aiLoading ? 'AI 解读生成中…' : fallbackText)

  const baseTitle = baseInfo ? `本卦 · ${baseInfo.name} (${baseInfo.number})` : '本卦'
  const changedTitle = changedInfo ? `变卦 · ${changedInfo.name} (${changedInfo.number})` : '变卦'
  const baseTrigram = baseInfo
    ? `${baseInfo.upper.name}上 / ${baseInfo.lower.name}下`
    : '等待计算'
  const changedTrigram = changedInfo
    ? `${changedInfo.upper.name}上 / ${changedInfo.lower.name}下`
    : '等待计算'
  const trigramText = `本卦：${baseTrigram}；变卦：${changedTrigram}`

  const summaryText = useMemo(() => {
    const main = baseInfo ? `${baseInfo.name}${baseInfo.upper.symbol}${baseInfo.lower.symbol}` : '未生成'
    const changed = changedInfo ? `${changedInfo.name}${changedInfo.upper.symbol}${changedInfo.lower.symbol}` : '未生成'
    return `${main} → ${changed}`
  }, [baseInfo, changedInfo])

  const createdAtText = result?.createdAt
    ? new Date(result.createdAt).toLocaleString('zh-CN', { hour12: false })
    : ''

  const handleShare = async () => {
    const title = 'AI 六爻占卜结果'
    const text = `问题：${result?.question || question || '未填写'}\n结果：${summaryText}\n动爻：${movingText}\n结论：仅供娱乐参考`
    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        setShareStatus('已调起分享')
        return
      }
      await navigator.clipboard.writeText(text)
      setShareStatus('结果已复制')
    } catch {
      setShareStatus('分享失败，请重试')
    }
  }

  const handleDeep = () => {
    setDeepStatus('深度解读功能即将上线')
  }

  const handleRetry = () => {
    if (!result?.lines || result.lines.length !== 6) return
    setAiRequested(false)
    setAiResult(null)
    setAiError('')
    setResult((prev) => (prev ? { ...prev, aiResult: null } : prev))
    const raw = sessionStorage.getItem('liuyao:last')
    if (raw) {
      const updated = {
        ...(JSON.parse(raw) as DivinationResult),
        aiResult: null
      }
      sessionStorage.setItem('liuyao:last', JSON.stringify(updated))
    }
    setAiNonce((prev) => prev + 1)
  }

  return (
    <main className="container">
      <div className="stack">
        <header className="card hero fade-in">
          <div className="row">
            <span className="pill">结果速览</span>
            {createdAtText ? <span className="small">生成时间：{createdAtText}</span> : null}
          </div>
          <h1 style={{ margin: 0 }}>占卜结果</h1>
          <p className="small">问题：{result?.question || question || '未填写'}</p>
          <div className="row">
            <span className="badge">{summaryText}</span>
            <span className="badge">{movingText}</span>
            <span
              className="badge sp"
              role="button"
              tabIndex={0}
              aria-pressed={showDetails}
              onClick={() => setShowDetails((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setShowDetails((prev) => !prev)
                }
              }}
            >
              查看详情
            </span>
          </div>
        </header>

        {showDetails ? (
          <section className="stack fade-in">
            <HexagramView title={baseTitle} lines={displayBase} />
            <HexagramView title={changedTitle} lines={displayChanged} />

            <ResultCard title="动爻" content={movingText} />
            <ResultCard title="上下卦" content={trigramText} />
          </section>
        ) : null }
        {aiError ? <ResultCard title="AI 状态" content={`AI 暂不可用：${aiError}`} /> : null}
        <ResultCard title="卦象含义" content={meaningText} />
        <ResultCard title="趋势分析" content={trendText} />
        <ResultCard title="风险提示" content={riskText} />
        <ResultCard title="建议" content={adviceText} />

        <div className="row">
          <button className="button" onClick={handleShare}>
            分享
          </button>
          <button className="button secondary" onClick={handleDeep}>
            深度解读
          </button>
          <Link className="button secondary" href="/">
            再占一次
          </Link>
          <button className="button ghost" onClick={handleRetry} disabled={aiLoading}>
            重新生成 AI 解读
          </button>
        </div>
        {shareStatus ? <p className="small">{shareStatus}</p> : null}
        {deepStatus ? <p className="small">{deepStatus}</p> : null}
      </div>
    </main>
  )
}
