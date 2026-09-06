#!/usr/bin/env node
/**
 * Reports which legal placeholders are still unfilled.
 *
 * Run with `npm run check:legal` from web/. Exits non-zero while anything is
 * outstanding, so it works as a pre-launch gate, but it is deliberately not
 * wired into the build or CI: the branch is handed over with these blank on
 * purpose, and failing the pipeline for that would be noise rather than signal.
 *
 * Reads the file as text rather than importing it, so this runs on a clean
 * checkout with no install and no TypeScript toolchain.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = join(here, '..', 'src', 'content', 'legal.ts')

let text
try {
  text = readFileSync(source, 'utf8')
} catch {
  console.error(`check:legal: cannot read ${source}`)
  process.exit(2)
}

// Field notes live in the same file, keyed by field name, so the explanation
// shown here is the one sitting next to the value rather than a second copy
// that could drift out of step with it.
const notes = {}
const notesBlock = text.match(/LEGAL_FIELD_NOTES[^=]*=\s*\{([\s\S]*?)\n\}/)
if (notesBlock) {
  for (const line of notesBlock[1].split('\n')) {
    const match = line.match(/^\s*(\w+):\s*['"](.*)['"],?\s*$/)
    if (match) notes[match[1]] = match[2]
  }
}

const legalBlock = text.match(/export const LEGAL = \{([\s\S]*?)\n\} as const/)
if (!legalBlock) {
  console.error('check:legal: could not find the LEGAL object in legal.ts')
  process.exit(2)
}

const unfilled = []
const filled = []
for (const line of legalBlock[1].split('\n')) {
  const match = line.match(/^\s*(\w+):\s*'(.*)',?\s*$/)
  if (!match) continue
  const [, field, value] = match
  if (/^\[\[[A-Z0-9_]+\]\]$/.test(value)) unfilled.push({ field, value })
  else filled.push({ field, value })
}

const label = (n) => `${n} ${n === 1 ? 'value' : 'values'}`

if (unfilled.length === 0) {
  console.log(`check:legal: all ${label(filled.length)} filled in.`)
  console.log('The legal pages are ready to publish, subject to a human reading them.')
  process.exit(0)
}

console.log(`check:legal: ${label(unfilled.length)} still to fill in.\n`)
console.log(`  Edit: web/src/content/legal.ts`)
console.log(`  Guide: docs/LEGAL_HANDOVER.md\n`)

for (const { field, value } of unfilled) {
  console.log(`  ${value}`)
  console.log(`      field: ${field}`)
  console.log(`      needs: ${notes[field] ?? '(no note recorded)'}\n`)
}

if (filled.length) {
  console.log(`Already filled in: ${filled.map((f) => f.field).join(', ')}`)
}

console.log(
  '\nUntil these are filled in, the pages render each placeholder highlighted,\n' +
    'so nothing ships looking finished when it is not.',
)
process.exit(1)
