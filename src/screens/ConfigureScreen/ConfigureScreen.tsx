import { useState, useRef } from 'react'
import type { Habit, Reward } from '../../types'
import { LOCAL_STORAGE_KEYS } from '../../types'
import { lsSet } from '../../storage/localStorage'
import { exportBackup, importBackup, readBackupMeta } from '../../storage/backup'
import styles from './ConfigureScreen.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

async function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blankHabit(): Habit {
  return {
    id: generateId('habit'),
    name: '',
    emoji: '✨',
    timeOfDay: 'morning',
    type: 'once-daily',
    requiresApproval: false,
    points: 5,
    isArchived: false,
  }
}

function blankReward(): Reward {
  return {
    id: generateId('reward'),
    name: '',
    emoji: '🎁',
    starCost: 50,
    isUnlocked: false,
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConfigureScreenProps {
  habits: Habit[]
  rewards: Reward[]
  onSaveHabit: (habit: Habit) => Promise<void>
  onSaveReward: (reward: Reward) => Promise<void>
  onDeleteReward: (rewardId: string) => Promise<void>
}

export function ConfigureScreen({
  habits,
  rewards,
  onSaveHabit,
  onSaveReward,
  onDeleteReward,
}: ConfigureScreenProps) {
  const [tab, setTab] = useState<'habits' | 'rewards' | 'backup'>('habits')

  return (
    <div className={styles.configure}>
      <div className={styles.subTabs}>
        <button
          className={[styles.subTab, tab === 'habits' ? styles.subTabActive : ''].join(' ')}
          onClick={() => setTab('habits')}
        >
          🎯 Habits
        </button>
        <button
          className={[styles.subTab, tab === 'rewards' ? styles.subTabActive : ''].join(' ')}
          onClick={() => setTab('rewards')}
        >
          🎁 Rewards
        </button>
        <button
          className={[styles.subTab, tab === 'backup' ? styles.subTabActive : ''].join(' ')}
          onClick={() => setTab('backup')}
        >
          📤 Backup
        </button>
      </div>

      {tab === 'habits'  && <HabitsConfig habits={habits} onSave={onSaveHabit} />}
      {tab === 'rewards' && <RewardsConfig rewards={rewards} onSave={onSaveReward} onDelete={onDeleteReward} />}
      {tab === 'backup'  && <BackupConfig />}
    </div>
  )
}

// ─── Habits config ────────────────────────────────────────────────────────────

function HabitsConfig({ habits, onSave }: { habits: Habit[]; onSave: (h: Habit) => Promise<void> }) {
  const [form, setForm] = useState<Habit | null>(null)
  const [saving, setSaving] = useState(false)

  const active = habits.filter(h => !h.isArchived)
  const archived = habits.filter(h => h.isArchived)
  const isNew = form ? !habits.some(h => h.id === form.id) : false

  async function handleSave() {
    if (!form || !form.name.trim()) return
    setSaving(true)
    await onSave({ ...form, name: form.name.trim() })
    setSaving(false)
    setForm(null)
  }

  async function handleArchiveToggle(habit: Habit) {
    await onSave({ ...habit, isArchived: !habit.isArchived })
  }

  const timeGroups: { key: Habit['timeOfDay']; label: string }[] = [
    { key: 'morning', label: '☀️ Morning' },
    { key: 'allday',  label: '💧 All Day' },
    { key: 'evening', label: '🌙 Evening' },
  ]

  return (
    <div className={styles.section}>
      {!form && (
        <button className={styles.addBtn} onClick={() => setForm(blankHabit())}>
          ＋ Add Habit
        </button>
      )}

      {form && (
        <HabitForm
          form={form}
          onChange={setForm}
          onSave={handleSave}
          onCancel={() => setForm(null)}
          saving={saving}
          isNew={isNew}
        />
      )}

      {timeGroups.map(({ key, label }) => {
        const group = active.filter(h => h.timeOfDay === key)
        if (group.length === 0) return null
        return (
          <div key={key} className={styles.group}>
            <div className={styles.groupLabel}>{label}</div>
            {group.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                isEditing={form?.id === habit.id}
                onEdit={() => setForm({ ...habit })}
                onArchiveToggle={() => handleArchiveToggle(habit)}
              />
            ))}
          </div>
        )
      })}

      {archived.length > 0 && (
        <div className={styles.group}>
          <div className={styles.groupLabel}>📁 Archived</div>
          {archived.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isEditing={false}
              onEdit={() => setForm({ ...habit })}
              onArchiveToggle={() => handleArchiveToggle(habit)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitRow({
  habit,
  isEditing,
  onEdit,
  onArchiveToggle,
}: {
  habit: Habit
  isEditing: boolean
  onEdit: () => void
  onArchiveToggle: () => void
}) {
  const typeBadge =
    habit.type === 'parent-only'    ? '👩‍👧'
    : habit.requiresApproval        ? '✅ OK'
    : habit.type === 'repeatable'   ? `×${habit.maxPerDay ?? '∞'}`
    :                                 '1×'

  return (
    <div className={[styles.habitRow, habit.isArchived ? styles.habitRowArchived : ''].join(' ')}>
      <span className={styles.habitEmoji}>{habit.emoji}</span>
      <div className={styles.habitInfo}>
        <span className={styles.habitName}>{habit.name}</span>
        <span className={styles.habitMeta}>
          <span className={styles.typeBadge}>{typeBadge}</span>
          {habit.points}⭐
        </span>
      </div>
      <div className={styles.rowActions}>
        <button
          className={styles.actionBtn}
          onClick={onEdit}
          aria-label={`Edit ${habit.name}`}
          disabled={isEditing}
        >✏️</button>
        <button
          className={styles.actionBtn}
          onClick={onArchiveToggle}
          aria-label={habit.isArchived ? `Restore ${habit.name}` : `Archive ${habit.name}`}
        >
          {habit.isArchived ? '↩️' : '📁'}
        </button>
      </div>
    </div>
  )
}

function HabitForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  form: Habit
  onChange: (h: Habit) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isNew: boolean
}) {
  const f = (patch: Partial<Habit>) => onChange({ ...form, ...patch })

  return (
    <div className={styles.formCard}>
      <div className={styles.formTitle}>{isNew ? '＋ New Habit' : '✏️ Edit Habit'}</div>

      <div className={styles.formRow}>
        <label className={styles.label}>Emoji</label>
        <div className={styles.emojiRow}>
          <span className={styles.emojiPreview}>{form.emoji || '?'}</span>
          <input
            className={styles.emojiInput}
            value={form.emoji}
            onChange={e => f({ emoji: e.target.value })}
            maxLength={4}
            placeholder="✨"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Name</label>
        <input
          className={styles.textInput}
          value={form.name}
          onChange={e => f({ name: e.target.value })}
          placeholder="e.g. Brush my teeth"
          autoFocus={isNew}
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Time</label>
        <select
          className={styles.select}
          value={form.timeOfDay}
          onChange={e => f({ timeOfDay: e.target.value as Habit['timeOfDay'] })}
        >
          <option value="morning">☀️ Morning</option>
          <option value="allday">💧 All Day</option>
          <option value="evening">🌙 Evening</option>
        </select>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Type</label>
        <select
          className={styles.select}
          value={form.type}
          onChange={e => {
            const type = e.target.value as Habit['type']
            f({ type, requiresApproval: type === 'once-daily' ? form.requiresApproval : false })
          }}
        >
          <option value="once-daily">Once a day (child taps)</option>
          <option value="repeatable">Repeatable (tap multiple times)</option>
          <option value="parent-only">Parent awards only</option>
        </select>
      </div>

      {form.type === 'once-daily' && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={form.requiresApproval ?? false}
            onChange={e => f({ requiresApproval: e.target.checked })}
          />
          Needs parent approval before stars count
        </label>
      )}

      {form.type === 'repeatable' && (
        <div className={styles.formRow}>
          <label className={styles.label}>Max / day</label>
          <input
            className={styles.numberInput}
            type="number"
            min={1}
            max={20}
            value={form.maxPerDay ?? ''}
            placeholder="No limit"
            onChange={e => f({ maxPerDay: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      )}

      <div className={styles.formRow}>
        <label className={styles.label}>Stars ⭐</label>
        <input
          className={styles.numberInput}
          type="number"
          min={1}
          max={100}
          value={form.points}
          onChange={e => f({ points: Math.max(1, Number(e.target.value)) })}
        />
      </div>

      <div className={styles.formBtns}>
        <button className={styles.saveBtn} onClick={onSave} disabled={saving || !form.name.trim()}>
          {saving ? '...' : '✅ Save'}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Rewards config ───────────────────────────────────────────────────────────

function RewardsConfig({
  rewards,
  onSave,
  onDelete,
}: {
  rewards: Reward[]
  onSave: (r: Reward) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState<Reward | null>(null)
  const [imageMode, setImageMode] = useState<'emoji' | 'image'>('emoji')
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isNew = form ? !rewards.some(r => r.id === form.id) : false

  function openEdit(reward: Reward) {
    setForm({ ...reward })
    setImageMode(reward.thumbnail ? 'image' : 'emoji')
  }

  async function handleSave() {
    if (!form || !form.name.trim()) return
    setSaving(true)
    const toSave = { ...form, name: form.name.trim() }
    if (!toSave.thumbnail) delete toSave.thumbnail
    await onSave(toSave)
    setSaving(false)
    setForm(null)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !form) return
    const dataUrl = await resizeImage(file)
    setForm({ ...form, thumbnail: dataUrl })
    e.target.value = ''
  }

  async function handleDelete(id: string) {
    await onDelete(id)
    setDeleteConfirmId(null)
  }

  return (
    <div className={styles.section}>
      {!form && (
        <button className={styles.addBtn} onClick={() => { setForm(blankReward()); setImageMode('emoji') }}>
          ＋ Add Reward
        </button>
      )}

      {form && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>{isNew ? '＋ New Reward' : '✏️ Edit Reward'}</div>

          <div className={styles.formRow}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.textInput}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ice cream treat"
              autoFocus={isNew}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Stars ⭐</label>
            <input
              className={styles.numberInput}
              type="number"
              min={1}
              value={form.starCost}
              onChange={e => setForm({ ...form, starCost: Math.max(1, Number(e.target.value)) })}
            />
          </div>

          <div className={styles.visualToggle}>
            <button
              className={[styles.toggleBtn, imageMode === 'emoji' ? styles.toggleActive : ''].join(' ')}
              onClick={() => setImageMode('emoji')}
            >😊 Emoji</button>
            <button
              className={[styles.toggleBtn, imageMode === 'image' ? styles.toggleActive : ''].join(' ')}
              onClick={() => setImageMode('image')}
            >🖼️ Photo</button>
          </div>

          {imageMode === 'emoji' ? (
            <div className={styles.formRow}>
              <label className={styles.label}>Emoji</label>
              <div className={styles.emojiRow}>
                <span className={styles.emojiPreview}>{form.emoji || '?'}</span>
                <input
                  className={styles.emojiInput}
                  value={form.emoji}
                  onChange={e => setForm({ ...form, emoji: e.target.value, thumbnail: undefined })}
                  maxLength={4}
                  placeholder="🎁"
                />
              </div>
            </div>
          ) : (
            <div className={styles.imageUploadArea}>
              {form.thumbnail ? (
                <div className={styles.thumbPreview}>
                  <img src={form.thumbnail} alt="Preview" className={styles.thumbImg} />
                  <button
                    className={styles.clearThumb}
                    onClick={() => setForm({ ...form, thumbnail: undefined })}
                  >✕ Remove</button>
                </div>
              ) : (
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  📷 Choose photo
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleImageUpload}
              />
            </div>
          )}

          <div className={styles.formBtns}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? '...' : '✅ Save'}
            </button>
            <button className={styles.cancelBtn} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {rewards.map(reward => (
        <div key={reward.id} className={styles.rewardRow}>
          {reward.thumbnail ? (
            <img src={reward.thumbnail} alt={reward.name} className={styles.rewardThumb} />
          ) : (
            <span className={styles.rewardEmoji}>{reward.emoji}</span>
          )}
          <div className={styles.rewardInfo}>
            <span className={styles.rewardName}>{reward.name}</span>
            <span className={styles.rewardCost}>⭐ {reward.starCost}</span>
          </div>
          <div className={styles.rowActions}>
            <button
              className={styles.actionBtn}
              onClick={() => openEdit(reward)}
              aria-label={`Edit ${reward.name}`}
            >✏️</button>
            {deleteConfirmId === reward.id ? (
              <div className={styles.deleteInline}>
                <button className={styles.deleteYes} onClick={() => handleDelete(reward.id)}>🗑️ Yes</button>
                <button className={styles.deleteCancelBtn} onClick={() => setDeleteConfirmId(null)}>No</button>
              </div>
            ) : (
              <button
                className={styles.actionBtn}
                onClick={() => setDeleteConfirmId(reward.id)}
                aria-label={`Delete ${reward.name}`}
              >🗑️</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── PIN change ───────────────────────────────────────────────────────────────

function PinChangeCard() {
  const [open, setOpen]         = useState(false)
  const [newPin, setNewPin]     = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  function handleSave() {
    if (newPin.length !== 4) { setError('PIN must be exactly 4 digits'); return }
    if (newPin !== confirm)  { setError("PINs don't match — try again"); return }
    lsSet(LOCAL_STORAGE_KEYS.PARENT_PIN, newPin)
    setOpen(false)
    setNewPin('')
    setConfirm('')
    setError('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  function handleCancel() {
    setOpen(false)
    setNewPin('')
    setConfirm('')
    setError('')
  }

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  return (
    <div className={styles.backupCard}>
      <div className={styles.backupCardTitle}>🔐 Parent PIN</div>
      {!open ? (
        <>
          {success && <p className={styles.pinSuccess}>PIN updated successfully!</p>}
          <p className={styles.backupDesc}>Change the 4-digit PIN used to access the parent area.</p>
          <button className={styles.uploadBtn} onClick={() => setOpen(true)}>
            Change PIN
          </button>
        </>
      ) : (
        <>
          <div className={styles.formRow}>
            <label className={styles.label}>New PIN</label>
            <input
              className={styles.pinInput}
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={e => { setNewPin(onlyDigits(e.target.value)); setError('') }}
              autoFocus
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Confirm</label>
            <input
              className={styles.pinInput}
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirm}
              onChange={e => { setConfirm(onlyDigits(e.target.value)); setError('') }}
            />
          </div>
          {error && <div className={styles.backupError}>{error}</div>}
          <div className={styles.formBtns}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={newPin.length !== 4 || confirm.length !== 4}
            >
              ✅ Save PIN
            </button>
            <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Backup config ────────────────────────────────────────────────────────────

function BackupConfig() {
  const [importFile, setImportFile]     = useState<File | null>(null)
  const [importMeta, setImportMeta]     = useState<{ exportedAt: string } | null>(null)
  const [exporting,  setExporting]      = useState(false)
  const [importing,  setImporting]      = useState(false)
  const [error,      setError]          = useState<string | null>(null)
  const [exported,   setExported]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      await exportBackup()
      setExported(true)
      setTimeout(() => setExported(false), 3000)
    } catch {
      setError('Export failed — please try again')
    } finally {
      setExporting(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      const meta = await readBackupMeta(file)
      setImportFile(file)
      setImportMeta(meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid file')
    }
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    setError(null)
    try {
      await importBackup(importFile)
      // page reloads after success — we won't reach here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setImporting(false)
    }
  }

  const exportedAt = importMeta?.exportedAt
    ? new Date(importMeta.exportedAt).toLocaleString()
    : null

  return (
    <div className={styles.section}>
      {/* ── PIN ────────────────────────────────────────────── */}
      <PinChangeCard />

      {/* ── Export ─────────────────────────────────────────── */}
      <div className={styles.backupCard}>
        <div className={styles.backupCardTitle}>📤 Export</div>
        <p className={styles.backupDesc}>
          Downloads a <code>.json</code> file with all habits, progress, rewards, and PIN.
          Keep it somewhere safe to restore on another device.
        </p>
        <button
          className={[styles.exportBtn, exported ? styles.exportBtnDone : ''].join(' ')}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Preparing…' : exported ? '✅ Downloaded!' : '⬇️ Download backup'}
        </button>
      </div>

      {/* ── Import ─────────────────────────────────────────── */}
      <div className={styles.backupCard}>
        <div className={styles.backupCardTitle}>📥 Import</div>
        <p className={styles.backupDesc}>
          Restores from a previous backup file. <strong>This replaces all current data.</strong>
        </p>

        {!importFile ? (
          <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
            📂 Choose backup file
          </button>
        ) : (
          <div className={styles.importReady}>
            <div className={styles.importMeta}>
              📅 Backup from {exportedAt}
            </div>
            <div className={styles.importWarning}>
              ⚠️ All current data will be replaced. Continue?
            </div>
            <div className={styles.importBtns}>
              <button
                className={styles.importConfirmBtn}
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? 'Restoring…' : '✅ Yes, restore'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => { setImportFile(null); setImportMeta(null) }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <div className={styles.backupError}>{error}</div>}

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className={styles.hiddenInput}
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
