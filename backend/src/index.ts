import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { interpretDivination } from './ai/openai.js'
import { buildDivination, generateLines, type LineValue } from './rules/liuyao.js'

config()

const app = new Hono()

app.use(
  '/*',
  async (c, next) => {
    const origin = c.req.header('Origin') || ''
    const allowed = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']

    if (allowed.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin)
      c.header('Vary', 'Origin')
    }

    c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type')

    if (c.req.method === 'OPTIONS') {
      return c.text('', 204)
    }

    await next()
  }
)

app.get('/health', (c) => c.json({ ok: true }))

app.post('/api/divination', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!body || typeof body.question !== 'string') {
    return c.json({ error: 'question is required' }, 400)
  }

  const isValidLine = (value: unknown): value is LineValue =>
    value === 6 || value === 7 || value === 8 || value === 9

  const providedLines =
    Array.isArray(body.lines) && body.lines.length === 6 && body.lines.every(isValidLine)
      ? (body.lines as LineValue[])
      : null

  const lines = providedLines ?? generateLines()
  const divination = buildDivination(lines)
  const aiResult = await interpretDivination({
    question: body.question,
    lines,
    hexagram: divination.hexagram,
    changedHexagram: divination.changedHexagram,
    movingLines: divination.movingLines
  })
  const aiError = !process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY not set' : null

  return c.json({
    hexagram: divination.hexagram,
    changed_hexagram: divination.changedHexagram,
    lines,
    changed_lines: divination.changedLines,
    moving_lines: divination.movingLines,
    ai_result: aiResult,
    ai_error: aiError
  })
})

app.get('/api/session/:id', (c) => {
  const { id } = c.req.param()
  return c.json({ id, status: 'not_implemented' })
})

const port = Number(process.env.PORT || 8787)

serve({
  fetch: app.fetch,
  port
})

console.log(`API server running at http://localhost:${port}`)
