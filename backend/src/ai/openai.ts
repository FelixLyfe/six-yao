import OpenAI from 'openai'
import type { HexagramInfo, LineValue } from '../rules/liuyao.js'

export type AiInterpretation = {
  meaning: string
  trend: string
  risk: string
  advice: string
  raw?: string
}

type InterpretInput = {
  question: string
  lines: LineValue[]
  hexagram: HexagramInfo | null
  changedHexagram: HexagramInfo | null
  movingLines: number[]
}

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'

export async function interpretDivination(payload: InterpretInput): Promise<AiInterpretation | null> {
  if (!client) return null

  const { question, lines, hexagram, changedHexagram, movingLines } = payload
  const base = hexagram
    ? `${hexagram.name} (${hexagram.number}) ${hexagram.upper.name}上/${hexagram.lower.name}下`
    : '未知'
  const changed = changedHexagram
    ? `${changedHexagram.name} (${changedHexagram.number}) ${changedHexagram.upper.name}上/${changedHexagram.lower.name}下`
    : '未知'
  const movingText = movingLines.length ? movingLines.map((line) => `第${line}爻`).join('、') : '无动爻'

  const prompt = `你是一位易经六爻解读助手，需提供温和、理性、非绝对化的建议。不要保证预测准确，不要给投资或医疗建议。

用户问题：${question}

占卜结果：
本卦：${base}
变卦：${changed}
动爻：${movingText}
六爻（自下而上）：${lines.join(', ')}

请输出 JSON，结构如下：
{
  "meaning": "卦象含义",
  "trend": "趋势分析",
  "risk": "风险提示",
  "advice": "建议"
}

限制：
- 仅供娱乐参考
- 不做绝对结论
- 语言简洁，每项 2-4 句
`

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    input: prompt,
    max_output_tokens: 600
  })

  const text = response.output_text?.trim() || ''
  if (!text) return null

  try {
    const parsed = JSON.parse(text) as AiInterpretation
    return {
      meaning: parsed.meaning || '暂无解读',
      trend: parsed.trend || '暂无解读',
      risk: parsed.risk || '暂无解读',
      advice: parsed.advice || '暂无解读'
    }
  } catch {
    return {
      meaning: '暂无解读',
      trend: '暂无解读',
      risk: '暂无解读',
      advice: '暂无解读',
      raw: text
    }
  }
}
