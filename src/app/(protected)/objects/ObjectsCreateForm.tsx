'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ObjectsCreateForm() {
  const router = useRouter()
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

      setName('')
      router.refresh()
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div className="field" style={{ flex: 1 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Я, Кот, Машина…"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btnPrimary"
        style={{ width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        {submitting ? '…' : 'Добавить'}
      </button>

      {error ? <div className="errorText">{error}</div> : null}
    </form>
  )
}
