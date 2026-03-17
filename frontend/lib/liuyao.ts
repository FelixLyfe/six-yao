export type LineValue = 6 | 7 | 8 | 9

export type DivinationResult = {
  question: string
  lines: LineValue[]
  changedLines: LineValue[]
  movingLines: number[]
  hexagram: HexagramInfo | null
  changedHexagram: HexagramInfo | null
  aiResult?: AiInterpretation | null
  createdAt: string
}

export type AiInterpretation = {
  meaning: string
  trend: string
  risk: string
  advice: string
  raw?: string
}

export type TrigramKey = 'qian' | 'kun' | 'kan' | 'li' | 'zhen' | 'gen' | 'xun' | 'dui'

export type TrigramInfo = {
  key: TrigramKey
  name: string
  symbol: string
  binary: string
}

export type HexagramInfo = {
  number: number
  name: string
  upper: TrigramInfo
  lower: TrigramInfo
}

const TRIGRAMS_BY_BINARY: Record<string, TrigramInfo> = {
  '111': { key: 'qian', name: '乾', symbol: '☰', binary: '111' },
  '110': { key: 'dui', name: '兑', symbol: '☱', binary: '110' },
  '101': { key: 'li', name: '离', symbol: '☲', binary: '101' },
  '100': { key: 'zhen', name: '震', symbol: '☳', binary: '100' },
  '011': { key: 'xun', name: '巽', symbol: '☴', binary: '011' },
  '010': { key: 'kan', name: '坎', symbol: '☵', binary: '010' },
  '001': { key: 'gen', name: '艮', symbol: '☶', binary: '001' },
  '000': { key: 'kun', name: '坤', symbol: '☷', binary: '000' }
}

const TRIGRAM_ORDER: TrigramKey[] = ['qian', 'kun', 'kan', 'li', 'zhen', 'gen', 'xun', 'dui']

const HEXAGRAM_NUMBER_TABLE: number[][] = [
  [1, 11, 5, 14, 34, 26, 9, 43],
  [12, 2, 8, 35, 16, 23, 20, 45],
  [6, 7, 29, 64, 40, 4, 59, 47],
  [13, 36, 63, 30, 55, 22, 37, 49],
  [25, 24, 3, 21, 51, 27, 42, 17],
  [33, 15, 39, 56, 62, 52, 53, 31],
  [44, 46, 48, 50, 32, 18, 57, 28],
  [10, 19, 60, 38, 54, 41, 61, 58]
]

const HEXAGRAM_NAMES: Record<number, string> = {
  1: '乾',
  2: '坤',
  3: '屯',
  4: '蒙',
  5: '需',
  6: '讼',
  7: '师',
  8: '比',
  9: '小畜',
  10: '履',
  11: '泰',
  12: '否',
  13: '同人',
  14: '大有',
  15: '谦',
  16: '豫',
  17: '随',
  18: '蛊',
  19: '临',
  20: '观',
  21: '噬嗑',
  22: '贲',
  23: '剥',
  24: '复',
  25: '无妄',
  26: '大畜',
  27: '颐',
  28: '大过',
  29: '坎',
  30: '离',
  31: '咸',
  32: '恒',
  33: '遁',
  34: '大壮',
  35: '晋',
  36: '明夷',
  37: '家人',
  38: '睽',
  39: '蹇',
  40: '解',
  41: '损',
  42: '益',
  43: '夬',
  44: '姤',
  45: '萃',
  46: '升',
  47: '困',
  48: '井',
  49: '革',
  50: '鼎',
  51: '震',
  52: '艮',
  53: '渐',
  54: '归妹',
  55: '丰',
  56: '旅',
  57: '巽',
  58: '兑',
  59: '涣',
  60: '节',
  61: '中孚',
  62: '小过',
  63: '既济',
  64: '未济'
}

export function generateLine(random: () => number = Math.random): LineValue {
  const r = random()
  if (r < 0.25) return 6
  if (r < 0.5) return 7
  if (r < 0.75) return 8
  return 9
}

export function generateLines(count = 6, random: () => number = Math.random): LineValue[] {
  const lines: LineValue[] = []
  for (let i = 0; i < count; i += 1) {
    lines.push(generateLine(random))
  }
  return lines
}

export function toChangedLine(line: LineValue): LineValue {
  if (line === 6) return 7
  if (line === 9) return 8
  return line
}

export function toYinYangBinary(lines: LineValue[]): string {
  return lines
    .slice(0, 3)
    .map((line) => (line === 7 || line === 9 ? '1' : '0'))
    .join('')
}

export function getTrigram(lines: LineValue[]): TrigramInfo | null {
  if (lines.length < 3) return null
  const binary = toYinYangBinary(lines)
  return TRIGRAMS_BY_BINARY[binary] ?? null
}

export function getHexagramInfo(lines: LineValue[]): HexagramInfo | null {
  if (lines.length < 6) return null
  const lower = getTrigram(lines.slice(0, 3))
  const upper = getTrigram(lines.slice(3, 6))
  if (!lower || !upper) return null
  const lowerIndex = TRIGRAM_ORDER.indexOf(lower.key)
  const upperIndex = TRIGRAM_ORDER.indexOf(upper.key)
  if (lowerIndex < 0 || upperIndex < 0) return null
  const number = HEXAGRAM_NUMBER_TABLE[lowerIndex][upperIndex]
  const name = HEXAGRAM_NAMES[number] ?? '未知'
  return { number, name, upper, lower }
}

export function getMovingLines(lines: LineValue[]): number[] {
  const moving: number[] = []
  lines.forEach((line, index) => {
    if (line === 6 || line === 9) moving.push(index + 1)
  })
  return moving
}

export function toDisplayLines(linesBottomUp: LineValue[], fallback: LineValue = 7): LineValue[] {
  const display: LineValue[] = Array.from({ length: 6 }, () => fallback)
  linesBottomUp.slice(0, 6).forEach((line, index) => {
    display[5 - index] = line
  })
  return display
}

export function buildDivinationResult(question: string, lines: LineValue[]): DivinationResult {
  const changedLines = lines.map(toChangedLine)
  const hexagram = getHexagramInfo(lines)
  const changedHexagram = getHexagramInfo(changedLines)
  return {
    question,
    lines,
    changedLines,
    movingLines: getMovingLines(lines),
    hexagram,
    changedHexagram,
    aiResult: null,
    createdAt: new Date().toISOString()
  }
}
