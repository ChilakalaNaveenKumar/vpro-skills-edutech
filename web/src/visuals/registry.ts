import { drawAgentic } from './agentic'
import { drawDeep } from './deep'
import { drawGenai } from './genai'
import { drawMl } from './ml'
import { drawPython } from './python'
import { drawRag } from './rag'
import type { DrawFn } from './types'

export type VisualKey = 'python' | 'ml' | 'deep' | 'genai' | 'agentic' | 'rag'

export const VISUALS: Record<VisualKey, DrawFn> = {
  python: drawPython,
  ml: drawMl,
  deep: drawDeep,
  genai: drawGenai,
  agentic: drawAgentic,
  rag: drawRag,
}

/** A representative frame for each visual, used under reduced motion. */
export const STILL_AT: Record<VisualKey, number> = {
  python: 5.2,
  ml: 5.4,
  deep: 3.4,
  genai: 4.4,
  agentic: 1.9,
  rag: 7.6,
}
