import { useCallback, useState } from 'react'
import DawnAscent from '../world/DawnAscent'
import StringTuneRuntime from '../motion/StringTuneRuntime'
import ChapterRail from '../components/ChapterRail'
import FloatingContact from '../components/FloatingContact'
import Arrival from '../sections/Arrival'
import Stakes from '../sections/Stakes'
import Path from '../sections/Path'
import Mentor from '../sections/Mentor'
import Horizon from '../sections/Horizon'

// Dawn Ascent: one continuous world, five chapters, near-black to full dawn.
// See docs/superpowers/specs/2026-09-01-vpro-dawn-ascent-design.md.
export default function HomePage() {
  const [activeChapter, setActiveChapter] = useState(0)
  const handleChapterChange = useCallback((index: number) => setActiveChapter(index), [])

  return (
    <>
      <DawnAscent onChapterChange={handleChapterChange} />
      <StringTuneRuntime />
      <ChapterRail active={activeChapter} />

      <Arrival activeChapter={activeChapter} />
      <Stakes activeChapter={activeChapter} />
      <Path activeChapter={activeChapter} />
      <Mentor activeChapter={activeChapter} />
      <Horizon activeChapter={activeChapter} />

      <FloatingContact />
    </>
  )
}
