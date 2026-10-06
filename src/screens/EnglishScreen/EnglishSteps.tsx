import { useEffect, useState } from 'react'
import type { EnglishLesson, EnglishWord } from '../../types'
import { speak, hasTamilVoice } from '../../utils/speech'
import { HearButton, HighlightWords, RecordPanel } from './VoiceControls'
import styles from './EnglishScreen.module.css'

// Each step walks through its items one card at a time and calls onDone at the end.

function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div className={styles.dots} aria-label={`${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={[styles.dot, i < current ? styles.dotDone : i === current ? styles.dotNow : ''].join(' ')} />
      ))}
    </div>
  )
}

function NextButton({ onClick, label = 'Next ▶' }: { onClick: () => void; label?: string }) {
  return <button className={styles.nextBtn} onClick={onClick}>{label}</button>
}

// ─── 1. Review: picture → can she say the word? ───────────────────────────────

interface ReviewStepProps {
  words: EnglishWord[]
  onDone: (results: Record<string, boolean>) => void
}

export function ReviewStep({ words, onDone }: ReviewStepProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const word = words[index]
  const answered = word.id in results

  function answer(remembered: boolean) {
    setResults(r => ({ ...r, [word.id]: remembered }))
    speak(word.en)
  }

  function next() {
    if (index + 1 < words.length) setIndex(index + 1)
    else onDone(results)
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>🔁 Remember these?</h2>
      <Dots total={words.length} current={index} />

      <div className={styles.card} key={word.id}>
        <div className={styles.bigEmoji} aria-hidden="true">{word.emoji}</div>
        {answered ? (
          <>
            <div className={styles.word}>{word.en}</div>
            <p className={styles.cheer}>{results[word.id] ? '🌟 Super!' : '💪 Now you know it!'}</p>
          </>
        ) : (
          <p className={styles.prompt}>What is this word? Say it!</p>
        )}
      </div>

      {answered ? (
        <NextButton onClick={next} />
      ) : (
        <div className={styles.choiceRow}>
          <button className={styles.yesBtn} onClick={() => answer(true)}>😊 I said it!</button>
          <button className={styles.helpBtn} onClick={() => answer(false)}>🙋 Help me</button>
        </div>
      )}
    </div>
  )
}

// ─── 2. New words: hear, see Tamil meaning, say it, hear yourself ─────────────

interface WordsStepProps {
  lesson: EnglishLesson
  onDone: () => void
}

export function WordsStep({ lesson, onDone }: WordsStepProps) {
  const [index, setIndex] = useState(0)
  const word = lesson.words[index]

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>{lesson.emoji} New words: {lesson.title}</h2>
      <Dots total={lesson.words.length} current={index} />
      {/* key resets the Tamil reveal + recording for each word */}
      <WordCard key={word.id} word={word} />
      <NextButton
        label={index + 1 < lesson.words.length ? 'Next word ▶' : 'Talk time ▶'}
        onClick={() => index + 1 < lesson.words.length ? setIndex(index + 1) : onDone()}
      />
    </div>
  )
}

function WordCard({ word }: { word: EnglishWord }) {
  const [showTamil, setShowTamil] = useState(false)

  // Say the new word as soon as the card appears.
  useEffect(() => { speak(word.en) }, [word.en])

  function revealTamil() {
    setShowTamil(true)
    if (hasTamilVoice()) speak(word.ta, { lang: 'ta' })
  }

  return (
    <div className={styles.card}>
      <div className={styles.bigEmoji} aria-hidden="true">{word.emoji}</div>
      <div className={styles.wordRow}>
        <span className={styles.word}>{word.en}</span>
        <HearButton text={word.en} size="big" />
      </div>

      {showTamil ? (
        <div className={styles.tamil} lang="ta">{word.ta}</div>
      ) : (
        <button className={styles.tamilBtn} onClick={revealTamil}>🇮🇳 தமிழில்?</button>
      )}

      <div className={styles.example}>
        <span><HighlightWords text={word.example} words={[word.en]} /></span>
        <HearButton text={word.example} />
      </div>

      <RecordPanel prompt={`Say "${word.en}"`} maxSeconds={5} />
    </div>
  )
}

// ─── 3. Talk time: answer the unicorn's question in a full sentence ───────────

export function TalkStep({ lesson, onDone }: { lesson: EnglishLesson; onDone: () => void }) {
  const { question, starter, example } = lesson.talk

  useEffect(() => { speak(question) }, [question])

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>💬 Talk time</h2>

      <div className={styles.card}>
        <div className={styles.bubbleRow}>
          <span className={styles.unicornFace} aria-hidden="true">🦄</span>
          <div className={styles.bubble}>
            {question}
            <HearButton text={question} />
          </div>
        </div>

        <div className={styles.starter}>
          {starter.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className={styles.blank}>&nbsp;</span>}
            </span>
          ))}
        </div>

        <div className={styles.example}>
          <span>💡 {example}</span>
          <HearButton text={example} label="Idea" />
        </div>

        <RecordPanel prompt="Say your answer" maxSeconds={12} />
        <p className={styles.parentHint}>
          Mama / Papa: help her fill the blank, then let her say the whole sentence alone.
        </p>
      </div>

      <NextButton label="😊 I said it! ▶" onClick={onDone} />
    </div>
  )
}

// ─── 4. Story: listen to each sentence, then say it back ──────────────────────

export function StoryStep({ lesson, onDone }: { lesson: EnglishLesson; onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const sentence = lesson.story[index]
  const lessonWords = lesson.words.map(w => w.en)

  useEffect(() => { speak(sentence) }, [sentence])

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>📖 Story time</h2>
      <Dots total={lesson.story.length} current={index} />

      <div className={styles.card} key={index}>
        <div className={styles.storyArt} aria-hidden="true">
          🦄 {lesson.words[index % lesson.words.length].emoji}
        </div>
        <p className={styles.storyText}>
          <HighlightWords text={sentence} words={lessonWords} />
        </p>
        <HearButton text={sentence} label="Again" size="big" />
        <p className={styles.prompt}>Your turn — say it like Sparkle!</p>
        <RecordPanel prompt="Say it" maxSeconds={10} />
      </div>

      <NextButton
        label={index + 1 < lesson.story.length ? 'Next ▶' : 'Finish! 🎉'}
        onClick={() => index + 1 < lesson.story.length ? setIndex(index + 1) : onDone()}
      />
    </div>
  )
}
