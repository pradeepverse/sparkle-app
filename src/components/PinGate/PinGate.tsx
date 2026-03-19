import { useState } from 'react'
import { lsGet, lsSet } from '../../storage/localStorage'
import { LOCAL_STORAGE_KEYS } from '../../types'
import styles from './PinGate.module.css'

interface PinGateProps {
  onUnlock: () => void
  onBack: () => void
}

const PIN_LENGTH = 4

export function PinGate({ onUnlock, onBack }: PinGateProps) {
  const savedPin = lsGet<string>(LOCAL_STORAGE_KEYS.PARENT_PIN)
  const isSetup = !savedPin

  const [input, setInput] = useState('')
  const [confirm, setConfirm] = useState('')
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')

  function triggerShake(msg: string) {
    setError(msg)
    setShake(true)
    setInput('')
    setTimeout(() => setShake(false), 500)
  }

  function handleDigit(digit: string) {
    if (input.length >= PIN_LENGTH) return
    const next = input + digit

    if (next.length < PIN_LENGTH) {
      setInput(next)
      return
    }

    // Full PIN entered
    if (isSetup) {
      if (stage === 'enter') {
        setConfirm(next)
        setInput('')
        setStage('confirm')
        setError('')
      } else {
        // Confirm stage
        if (next === confirm) {
          lsSet(LOCAL_STORAGE_KEYS.PARENT_PIN, next)
          onUnlock()
        } else {
          setConfirm('')
          setStage('enter')
          triggerShake("PINs don't match — try again!")
        }
      }
    } else {
      // Verify mode
      if (next === savedPin) {
        onUnlock()
      } else {
        triggerShake('Wrong PIN — try again!')
      }
    }
  }

  function handleBackspace() {
    setInput(prev => prev.slice(0, -1))
    setError('')
  }

  const dots = Array.from({ length: PIN_LENGTH }).map((_, i) => (
    <span
      key={i}
      className={[styles.dot, i < input.length ? styles.dotFilled : ''].join(' ')}
      aria-hidden="true"
    />
  ))

  const title = isSetup
    ? stage === 'enter' ? 'Create a parent PIN 🔐' : 'Confirm your PIN 🔐'
    : 'Parent area 🔐'

  const subtitle = isSetup
    ? stage === 'enter' ? 'Choose a 4-digit PIN' : 'Enter it again to confirm'
    : 'Enter your PIN to continue'

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Go back">← Back</button>

        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>

        {/* Dot display */}
        <div className={[styles.dots, shake ? styles.shake : ''].join(' ')} aria-label={`${input.length} of ${PIN_LENGTH} digits entered`}>
          {dots}
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {/* Numpad */}
        <div className={styles.numpad} role="group" aria-label="Number pad">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} className={styles.key} onClick={() => handleDigit(d)} aria-label={d}>
              {d}
            </button>
          ))}
          <div className={styles.keyEmpty} aria-hidden="true" />
          <button className={styles.key} onClick={() => handleDigit('0')} aria-label="0">0</button>
          <button className={styles.keyBack} onClick={handleBackspace} aria-label="Backspace">⌫</button>
        </div>
      </div>
    </div>
  )
}
