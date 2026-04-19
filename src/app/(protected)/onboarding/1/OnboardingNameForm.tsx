'use client'

import { useMemo, useState } from 'react'

export default function OnboardingNameForm() {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => name.trim().length >= 2 && !submitting, [name, submitting])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/profile/display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Что-то пошло не так')
        return
      }

      window.location.replace('/onboarding/2')
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <label className="fieldLabel" htmlFor="name">Имя</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Марья, Коля, Лис…"
          autoComplete="nickname"
          autoFocus
        />
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btnPrimary"
      >
        {submitting ? 'Запоминаем…' : 'Дальше →'}
      </button>
    </form>
  )
}
