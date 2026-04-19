'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import ActionEmojiField from '../../_components/ActionEmojiField'

export default function OnboardingCreateFirstAction({ objectCareId }: { objectCareId: string }) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('✨')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => label.trim().length >= 2 && icon.trim().length > 0 && !submitting, [
    label,
    icon,
    submitting,
  ])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/objects/${objectCareId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, icon }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Что-то пошло не так')
        return
      }

      router.push(`/onboarding/4?objectCareId=${objectCareId}`)
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <label className="fieldLabel" htmlFor="actionLabel">Название действия</label>
        <input
          id="actionLabel"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Покормил, Попил воды, Прогулка…"
          autoFocus
        />
      </div>

      <ActionEmojiField value={icon} onChange={setIcon} disabled={submitting} />

      {error ? <div className="errorText">{error}</div> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btnPrimary"
      >
        {submitting ? 'Добавляем…' : 'Дальше →'}
      </button>
    </form>
  )
}
