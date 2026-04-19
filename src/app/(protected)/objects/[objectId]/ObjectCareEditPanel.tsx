'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import ConfirmDialog from '../../_components/ConfirmDialog'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
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

  async function performDeleteObject() {
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
    <>
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

        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="btnIcon btnIcon--danger"
          style={{ padding: '12px 16px', width: '100%' }}
        >
          Удалить объект
        </button>

        {error ? <div className="errorText">{error}</div> : null}
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Удалить объект?"
        message={
          'Объект исчезнет из списка «Забота». Все действия и вся история по нему будут удалены безвозвратно.'
        }
        cancelLabel="Отмена"
        confirmLabel="Удалить навсегда"
        danger
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false)
          void performDeleteObject()
        }}
      />
    </>
  )
}
