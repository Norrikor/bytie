'use client'

import { useMemo, useState } from 'react'

const suggestions = ['Я', 'Кот', 'Машина', 'Цветок', 'Пёс']

export default function OnboardingObjectForm() {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => name.trim().length >= 1 && !submitting, [name, submitting])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Что-то пошло не так')
        return
      }

      const json = (await res.json().catch(() => null)) as any
      const objectId = json?.object?.id as string | undefined
      if (objectId) {
        window.location.replace(`/onboarding/3?objectCareId=${objectId}`)
      } else {
        window.location.replace('/onboarding/3')
      }
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <label className="fieldLabel" htmlFor="objName">Название</label>
        <input
          id="objName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Я, Кот, Машина…"
          autoFocus
        />
      </div>

      <div className="emojiPicker">
        {suggestions.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setName(v)}
            className={`pill${name === v ? ' pill--active' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btnPrimary"
      >
        {submitting ? 'Создаём…' : 'Дальше →'}
      </button>
    </form>
  )
}
