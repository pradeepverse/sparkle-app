import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../storage/supabase'
import { loadUserData, seedNewUser, type UserData } from '../storage/db'
import { DEFAULT_HABITS } from '../data/habits'
import { DEFAULT_REWARDS } from '../data/rewards'
import { DEFAULT_PROGRESS } from '../types'
import App from '../App'
import { LoginScreen } from './LoginScreen'
import styles from './AuthGate.module.css'

/** Waits for a session, loads (or seeds) that user's data, then mounts the app. */
export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (authLoading) return <Splash />
  if (!session) return <LoginScreen />
  // Keyed on user id so switching accounts remounts with fresh state.
  return <UserDataLoader key={session.user.id} email={session.user.email ?? ''} />
}

function UserDataLoader({ email }: { email: string }) {
  const [data, setData] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      let loaded = await loadUserData()
      if (!loaded) {
        await seedNewUser(DEFAULT_HABITS, DEFAULT_REWARDS, DEFAULT_PROGRESS)
        loaded = await loadUserData()
        if (!loaded) throw new Error('Could not set up your account')
      }
      if (!cancelled) setData(loaded)
    }
    setError(null)
    load().catch(err => {
      console.error(err)
      if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your data')
    })
    return () => { cancelled = true }
  }, [attempt])

  if (error) {
    return (
      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.emoji}>😿</div>
          <div className={styles.title}>Couldn't load Sparkle</div>
          <p className={styles.error}>{error}</p>
          <button className={styles.primaryBtn} onClick={() => setAttempt(a => a + 1)}>Try again</button>
          <button className={styles.linkBtn} onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    )
  }
  if (!data) return <Splash />
  return <App initialData={data} userEmail={email} onSignOut={() => supabase.auth.signOut()} />
}

function Splash() {
  return (
    <div className={styles.center}>
      <div className={styles.splash}>🦄</div>
    </div>
  )
}
