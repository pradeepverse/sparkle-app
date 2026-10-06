import { useState } from 'react'
import { supabase } from '../storage/supabase'
import styles from './AuthGate.module.css'

export function LoginScreen() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setError(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // Come back to whatever origin we're on (localhost in dev, pages.dev in prod).
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    })
    // On success the browser navigates away to Google, so only errors land here.
    if (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <div className={styles.center}>
      <div className={styles.card}>
        <div className={styles.emoji}>🦄</div>
        <div className={styles.title}>Sparkle</div>
        <p className={styles.subtitle}>A magical habit tracker for kids</p>
        <button className={styles.primaryBtn} onClick={handleGoogle} disabled={busy}>
          {busy ? 'Opening Google…' : 'Sign in with Google'}
        </button>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.hint}>A grown-up signs in once on each device.</p>
      </div>
    </div>
  )
}
