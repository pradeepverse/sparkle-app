import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'recording' | 'playing'

export function canRecord(): boolean {
  return typeof window !== 'undefined'
    && 'MediaRecorder' in window
    && !!navigator.mediaDevices?.getUserMedia
}

/**
 * Record-and-play-back for the child's own voice. Recordings stay in memory
 * only (an object URL) — nothing is uploaded or saved.
 */
export function useRecorder(maxSeconds = 8) {
  const [state, setState] = useState<RecorderState>('idle')
  const [clipUrl, setClipUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef    = useRef<number | undefined>(undefined)
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const urlRef      = useRef<string | null>(null)
  const startingRef = useRef(false)   // waiting on the mic permission prompt
  const mountedRef  = useRef(true)

  const replaceClip = useCallback((url: string | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = url
    setClipUrl(url)
  }, [])

  const stop = useCallback(() => {
    window.clearTimeout(timerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setState('idle')
    }
  }, [])

  const start = useCallback(async () => {
    // Ignore double taps while the mic is being opened.
    if (startingRef.current || recorderRef.current) return
    startingRef.current = true
    setError(null)
    window.speechSynthesis?.cancel()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mountedRef.current) {
        // Left the card while the permission prompt was up.
        stream.getTracks().forEach(t => t.stop())
        return
      }
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
      recorder.onstop = () => {
        // Release the mic so the "recording" indicator goes away.
        stream.getTracks().forEach(t => t.stop())
        recorderRef.current = null
        if (chunks.length) {
          replaceClip(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })))
        }
        setState('idle')
      }
      recorderRef.current = recorder
      recorder.start()
      setState('recording')
      timerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, maxSeconds * 1000)
    } catch (err) {
      console.error(err)
      if (mountedRef.current) {
        setError('Please allow the microphone for this app')
        setState('idle')
      }
    } finally {
      startingRef.current = false
    }
  }, [maxSeconds, replaceClip])

  const play = useCallback(() => {
    if (!urlRef.current) return
    window.speechSynthesis?.cancel()
    const audio = new Audio(urlRef.current)
    audioRef.current = audio
    audio.onended = () => { audioRef.current = null; setState('idle') }
    audio.onerror = () => { audioRef.current = null; setState('idle') }
    setState('playing')
    audio.play().catch(() => setState('idle'))
  }, [])

  const reset = useCallback(() => {
    stop()
    replaceClip(null)
    setError(null)
  }, [stop, replaceClip])

  // Clean up on unmount: stop the mic and free the clip.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      window.clearTimeout(timerRef.current)
      const rec = recorderRef.current
      if (rec?.state === 'recording') {
        rec.onstop = null
        rec.stop()
        rec.stream.getTracks().forEach(t => t.stop())
      }
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return { state, clipUrl, error, start, stop, play, reset }
}
