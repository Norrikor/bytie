'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ObjectCareEditPanel({
  objectId,
  initialName,
  isOwner,
}: {
  objectId: string
  initialName: string
  isOwner: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSave = useMemo(() => name.trim().length >= 1 && name !== initialName && !saving, [name, initialName, saving])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/objects/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Ошибка')
        return
      }
      router.refresh()
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    const ok = confirm('Удалить объект? Связанные действия и история тоже уйдут.')
    if (!ok) return

    setError(null)
    try {
      const res = await fetch(`/api/objects/${objectId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Ошибка')
        return
      }
      router.push('/objects')
    } catch {
      setError('Не удалось подключиться')
    }
  }

  if (!isOwner) return null

  return (
    <form onSubmit={onSave} className="form">
      <div className="field">
        <label className="fieldLabel">Название</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button type="submit" disabled={!canSave} className="btnPrimary">
        {saving ? 'Сохраняем…' : 'Сохранить изменения'}
      </button>

      <button type="button" onClick={onDelete} className="btnIcon btnIcon--danger" style={{ padding: '12px 16px', width: '100%' }}>
        Удалить объект
      </button>

      {error ? <div className="errorText">{error}</div> : null}
    </form>
  )
}
