import { useEffect, useMemo, useState } from 'react'
import type { DailyEntry, EnglishLesson, EnglishProgress, EnglishWord } from '../../types'
import { ENGLISH_LESSONS } from '../../data/englishLessons'
import { getDueWords, getLearnedWords, getTodaysLesson, isLessonDoneToday } from '../../utils/wordReview'
import { canSpeak, speak, stopSpeaking } from '../../utils/speech'
import { ReviewStep, WordsStep, TalkStep, StoryStep } from './EnglishSteps'
import styles from './EnglishScreen.module.css'

type Phase = 'intro' | 'review' | 'words' | 'talk' | 'story' | 'done'

const STEPS: { phase: Phase; emoji: string; label: string }[] = [
  { phase: 'review', emoji: '🔁', label: 'Remember' },
  { phase: 'words',  emoji: '✨', label: 'New words' },
  { phase: 'talk',   emoji: '💬', label: 'Talk' },
  { phase: 'story',  emoji: '📖', label: 'Story' },
]

interface EnglishScreenProps {
  progress: EnglishProgress | null   // null while loading
  loadError: boolean
  entry: DailyEntry | undefined      // today's English Time habit entry
  onFinish: (lesson: EnglishLesson, reviewResults: Record<string, boolean>) => Promise<void>
  onBack: () => void
}

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EnglishScreen({ progress, loadError, entry, onFinish, onBack }: EnglishScreenProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  // Frozen when the session starts so finishing (which updates progress) can't
  // swap the lesson or review list mid-session.
  const [session, setSession] = useState<{
    lesson: EnglishLesson
    reviewWords: EnglishWord[]
    practice: boolean
  } | null>(null)
  const [reviewResults, setReviewResults] = useState<Record<string, boolean>>({})
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Stop any speech when leaving the screen.
  useEffect(() => stopSpeaking, [])

  if (loadError) {
    return (
      <main className={styles.screen}>
        <Header onBack={onBack} />
        <div className={styles.card}>
          <div className={styles.bigEmoji}>😿</div>
          <p className={styles.prompt}>English Time could not load. Please check the internet and try again.</p>
        </div>
      </main>
    )
  }

  if (!progress) {
    return (
      <main className={styles.screen}>
        <Header onBack={onBack} />
        <div className={styles.loading} aria-label="Loading">🦄</div>
      </main>
    )
  }

  const today = todayString()

  function start() {
    if (!progress) return
    const lessonDone = isLessonDoneToday(progress, today)
    // Only a practice run if today's stars were also recorded — otherwise (e.g.
    // the parent reset the day) finishing should still earn them.
    const practice = lessonDone && (entry?.completionCount ?? 0) >= 1
    const lesson = getTodaysLesson(progress, today)
    const lessonWordIds = new Set(lesson.words.map(w => w.id))
    // Review only once a day so words don't move between boxes twice.
    const reviewWords = lessonDone ? [] : getDueWords(progress, today, lessonWordIds)
    setSession({ lesson, reviewWords, practice })
    setReviewResults({})
    setSaveState('idle')
    setPhase(reviewWords.length ? 'review' : 'words')
  }

  async function finish() {
    if (!session) return
    setPhase('done')
    if (session.practice) return
    setSaveState('saving')
    try {
      await onFinish(session.lesson, reviewResults)
      setSaveState('saved')
    } catch (err) {
      console.error(err)
      setSaveState('error')
    }
  }

  function exitSession() {
    stopSpeaking()
    setSession(null)
    setPhase('intro')
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro' || !session) {
    return (
      <Intro
        progress={progress}
        today={today}
        entry={entry}
        onStart={start}
        onBack={onBack}
      />
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <main className={styles.screen}>
        <Header onBack={onBack} />
        <Done
          lesson={session.lesson}
          practice={session.practice}
          saveState={saveState}
          onRetry={finish}
          onHome={onBack}
          onAgain={exitSession}
        />
      </main>
    )
  }

  // ── Lesson steps ───────────────────────────────────────────────────────────
  const steps = STEPS.filter(s => s.phase !== 'review' || session.reviewWords.length)
  return (
    <main className={styles.screen}>
      <div className={styles.sessionBar}>
        <button className={styles.exitBtn} onClick={exitSession} aria-label="Stop lesson">✕</button>
        <div className={styles.stepChips}>
          {steps.map(s => {
            const idx = steps.findIndex(x => x.phase === phase)
            const mine = steps.indexOf(s)
            return (
              <span
                key={s.phase}
                className={[styles.stepChip, mine < idx ? styles.stepChipDone : mine === idx ? styles.stepChipNow : ''].join(' ')}
              >
                {mine < idx ? '✅' : s.emoji}<span className={styles.stepChipLabel}>{s.label}</span>
              </span>
            )
          })}
        </div>
      </div>

      {phase === 'review' && (
        <ReviewStep
          words={session.reviewWords}
          onDone={results => { setReviewResults(results); setPhase('words') }}
        />
      )}
      {phase === 'words' && <WordsStep lesson={session.lesson} onDone={() => setPhase('talk')} />}
      {phase === 'talk'  && <TalkStep  lesson={session.lesson} onDone={() => setPhase('story')} />}
      {phase === 'story' && <StoryStep lesson={session.lesson} onDone={finish} />}
    </main>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className={styles.header}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">← Home</button>
      <h1 className={styles.title}>English Time 🗣️</h1>
    </header>
  )
}

// ─── Intro: today's lesson + word garden ─────────────────────────────────────

interface IntroProps {
  progress: EnglishProgress
  today: string
  entry: DailyEntry | undefined
  onStart: () => void
  onBack: () => void
}

function Intro({ progress, today, entry, onStart, onBack }: IntroProps) {
  const doneToday = isLessonDoneToday(progress, today) && (entry?.completionCount ?? 0) >= 1
  const lesson = getTodaysLesson(progress, today)
  const learned = useMemo(() => getLearnedWords(progress), [progress])
  const lessonNumber = ENGLISH_LESSONS.indexOf(lesson) + 1

  const greeting = doneToday
    ? 'You did English Time today! Want to practise again?'
    : `Today we learn: ${lesson.title}!`

  return (
    <main className={styles.screen}>
      <Header onBack={onBack} />

      <div className={styles.bubbleRow}>
        <span className={styles.unicornFace} aria-hidden="true">🦄</span>
        <button className={styles.bubble} onClick={() => speak(greeting)}>
          {greeting} 🔊
        </button>
      </div>

      <div className={styles.lessonCard}>
        <div className={styles.lessonEmoji} aria-hidden="true">{lesson.emoji}</div>
        <div className={styles.lessonInfo}>
          <span className={styles.lessonNum}>Lesson {lessonNumber}</span>
          <span className={styles.lessonTitle}>{lesson.title}</span>
          <span className={styles.lessonWords} aria-hidden="true">
            {lesson.words.map(w => w.emoji).join(' ')}
          </span>
        </div>
      </div>

      <div className={styles.stepPreview}>
        {STEPS.map(s => (
          <span key={s.phase} className={styles.stepPreviewItem}>
            <span aria-hidden="true">{s.emoji}</span> {s.label}
          </span>
        ))}
      </div>

      <button className={styles.startBtn} onClick={onStart}>
        {doneToday ? '🔁 Practise again' : "▶ Let's start!"}
      </button>

      {entry?.approvalStatus === 'pending' && (
        <p className={styles.statusNote}>⏳ Show Mama / Papa to get your stars!</p>
      )}
      {entry && entry.approvalStatus !== 'pending' && entry.completionCount >= 1 && (
        <p className={styles.statusNote}>⭐ Stars earned today. Super job!</p>
      )}
      {!canSpeak() && (
        <p className={styles.statusNote}>🔇 This browser can't talk. Mama / Papa, please read the words aloud.</p>
      )}

      <WordGarden words={learned} />
    </main>
  )
}

// ─── Word garden: every learned word is a flower; tap to hear it ─────────────

const BOX_FLOWER = ['', '🌱', '🌿', '🌷', '🌻', '🌸']

function WordGarden({ words }: { words: (EnglishWord & { box: number })[] }) {
  if (!words.length) {
    return (
      <section className={styles.garden}>
        <h2 className={styles.gardenTitle}>🌱 My Word Garden</h2>
        <p className={styles.gardenEmpty}>Finish a lesson to plant your first words!</p>
      </section>
    )
  }
  return (
    <section className={styles.garden}>
      <h2 className={styles.gardenTitle}>🌻 My Word Garden: {words.length} words</h2>
      <p className={styles.gardenHint}>Words grow from 🌱 to 🌸 each time you remember them. Tap one to hear it!</p>
      <div className={styles.gardenGrid}>
        {words.map(w => (
          <button key={w.id} className={styles.gardenWord} onClick={() => speak(w.en)} aria-label={`Hear ${w.en}`}>
            <span className={styles.gardenEmoji} aria-hidden="true">{w.emoji}</span>
            <span className={styles.gardenLabel}>{w.en}</span>
            <span className={styles.gardenFlower} aria-hidden="true">{BOX_FLOWER[w.box] ?? '🌸'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

// ─── Done ─────────────────────────────────────────────────────────────────────

interface DoneProps {
  lesson: EnglishLesson
  practice: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onRetry: () => void
  onHome: () => void
  onAgain: () => void
}

function Done({ lesson, practice, saveState, onRetry, onHome, onAgain }: DoneProps) {
  useEffect(() => {
    speak(practice ? 'Great practice!' : 'Well done! You learned new words today!')
  }, [practice])

  return (
    <div className={styles.step}>
      <div className={[styles.card, styles.doneCard].join(' ')}>
        <div className={styles.doneEmoji} aria-hidden="true">🦄🎉</div>
        <h2 className={styles.doneTitle}>{practice ? 'Great practice!' : 'Well done!'}</h2>
        <p className={styles.prompt}>Today's words:</p>
        <div className={styles.doneWords}>
          {lesson.words.map(w => (
            <button key={w.id} className={styles.doneWord} onClick={() => speak(w.en)}>
              {w.emoji} {w.en}
            </button>
          ))}
        </div>

        {!practice && saveState === 'saving' && <p className={styles.statusNote}>Saving…</p>}
        {!practice && saveState === 'saved' && (
          <p className={styles.starNote}>👆 Show Mama / Papa to get your ⭐ stars!</p>
        )}
        {!practice && saveState === 'error' && (
          <>
            <p className={styles.recordError}>Could not save. Check the internet.</p>
            <button className={styles.helpBtn} onClick={onRetry}>🔁 Try again</button>
          </>
        )}
      </div>

      <div className={styles.choiceRow}>
        <button className={styles.yesBtn} onClick={onHome}>🏠 Home</button>
        <button className={styles.helpBtn} onClick={onAgain}>🔁 Again</button>
      </div>
    </div>
  )
}
