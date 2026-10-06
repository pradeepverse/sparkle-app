// Text-to-speech via the browser's built-in Web Speech API — free, offline on
// most Android devices, no audio files. Prefers an Indian-English voice so the
// accent matches what the child hears at school.

const EN_PREFERENCE = ['en-IN', 'en-GB', 'en-US', 'en']

let voices: SpeechSynthesisVoice[] = []
// Held so Chrome doesn't garbage-collect the utterance and drop its onend.
let current: SpeechSynthesisUtterance | null = null

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  // Chrome fills the voice list asynchronously.
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

function pickVoice(langPrefs: string[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices()
  for (const pref of langPrefs) {
    const p = pref.toLowerCase()
    const match = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(p))
    if (match) return match
  }
  return undefined
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function hasTamilVoice(): boolean {
  return !!pickVoice(['ta'])
}

/** Speaks text, cancelling anything already playing. Resolves when finished. */
export function speak(text: string, opts: { lang?: 'en' | 'ta'; rate?: number } = {}): Promise<void> {
  if (!canSpeak()) return Promise.resolve()
  const synth = window.speechSynthesis
  synth.cancel()

  const lang = opts.lang ?? 'en'
  const utter = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(lang === 'ta' ? ['ta'] : EN_PREFERENCE)
  if (voice) utter.voice = voice
  utter.lang = voice?.lang ?? (lang === 'ta' ? 'ta-IN' : 'en-IN')
  // A little slower than normal so a young learner can catch each sound.
  utter.rate = opts.rate ?? 0.8
  utter.pitch = 1.1

  current = utter
  return new Promise(resolve => {
    // Android Chrome sometimes never fires onend; don't leave callers hanging.
    const fallback = window.setTimeout(done, text.length * 120 + 2000)
    function done() {
      window.clearTimeout(fallback)
      if (current === utter) current = null
      resolve()
    }
    utter.onend = done
    utter.onerror = done
    synth.speak(utter)
  })
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
