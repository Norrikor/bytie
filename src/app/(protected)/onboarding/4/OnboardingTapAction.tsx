'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingTapAction({
  objectCareId,
  actions,
}: {
  objectCareId: string
  actions: Array<{ id: string; label: string; icon: string }>
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onTap(actionId: string) {
    setBusyId(actionId)
    setError(null)
    try {
      const res = await fetch(`/api/objects/${objectCareId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectActionId: actionId }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Что-то пошло не так')
        return
      }

      router.push('/feed')
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="form">
      <div className="actionsGrid">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onTap(a.id)}
            disabled={busyId !== null}
            className="actionTile"
            style={{ opacity: busyId === a.id ? 0.6 : 1 }}
          >
            <span className="actionTileIcon">{a.icon}</span>
            <span className="actionTileLabel">{a.label}</span>
          </button>
        ))}
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button
        type="button"
        onClick={() => router.push(`/onboarding/3?objectCareId=${objectCareId}`)}
        className="btnGhost"
      >
        + Добавить ещё действие
      </button>
    </div>
  )
}
