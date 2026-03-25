'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Action = {
  id: string
  label: string
  icon: string
  color: string | null
  createdById: string
}

type EventItem = {
  id: string
  objectActionId: string | null
  actorId: string
  actorName: string | null
  occurredAt: string
  labelSnapshot: string
  iconSnapshot: string
}

const emojiPresets = ['💧', '🍽️', '😺', '🩺', '🎮', '🔥', '🌿', '🐾', '✨', '☀️', '🫀', '🌱']

export default function ObjectCareInteractive({
  objectId,
  currentUserId,
  actions,
  events,
}: {
  objectId: string
  currentUserId: string
  actions: Action[]
  events: EventItem[]
}) {
  const router = useRouter()

  const [localEvents, setLocalEvents] = useState<EventItem[]>(events)
  useEffect(() => setLocalEvents(events), [events])

  const toastTimerRef = useRef<number | null>(null)
  const [toastUndoEventId, setToastUndoEventId] = useState<string | null>(null)
  const [pressedActionId, setPressedActionId] = useState<string | null>(null)

  function showUndoToast(eventId: string) {
    setToastUndoEventId(eventId)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToastUndoEventId(null)
      router.refresh()
    }, 5000)
  }

  const [showAddAction, setShowAddAction] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('✨')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const editingAction = useMemo(
    () => (editingActionId ? actions.find((a) => a.id === editingActionId) ?? null : null),
    [editingActionId, actions],
  )
  const [editLabel, setEditLabel] = useState('')
  const [editIcon, setEditIcon] = useState('✨')
  const [editError, setEditError] = useState<string | null>(null)

  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editEventActionId, setEditEventActionId] = useState<string | null>(null)

  function openEditAction(a: Action) {
    setEditingActionId(a.id)
    setEditLabel(a.label)
    setEditIcon(a.icon)
    setEditError(null)
  }

  async function createAction() {
    setAddError(null)
    setAdding(true)
    try {
      const res = await fetch(`/api/objects/${objectId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, icon: newIcon }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setAddError(json?.error ?? 'Ошибка')
        return
      }
      setNewLabel('')
      setNewIcon('✨')
      setShowAddAction(false)
      router.refresh()
    } catch {
      setAddError('Не удалось подключиться')
    } finally {
      setAdding(false)
    }
  }

  async function saveEditedAction() {
    if (!editingAction) return
    setEditError(null)
    try {
      const res = await fetch(`/api/objects/${objectId}/actions/${editingAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel, icon: editIcon }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setEditError(json?.error ?? 'Ошибка')
        return
      }
      setEditingActionId(null)
      router.refresh()
    } catch {
      setEditError('Не удалось подключиться')
    }
  }

  async function deleteAction(actionId: string) {
    const ok = confirm('Удалить действие? История сохранится, подпись и эмодзи останутся.')
    if (!ok) return
    try {
      const res = await fetch(`/api/objects/${objectId}/actions/${actionId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setEditError(json?.error ?? 'Ошибка')
        return
      }
      router.refresh()
    } catch {
      setEditError('Не удалось подключиться')
    }
  }

  async function addEvent(actionId: string) {
    try {
      setPressedActionId(actionId)
      window.setTimeout(() => setPressedActionId(null), 220)
      await fetch(`/api/objects/${objectId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectActionId: actionId }),
      })
      router.refresh()
    } catch {
      // тихо
    }
  }

  async function deleteEvent(eventId: string) {
    const ok = confirm('Убрать запись из истории?')
    if (!ok) return
    try {
      const res = await fetch(`/api/action-events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) return

      setLocalEvents((prev) => prev.filter((e) => e.id !== eventId))
      setEditingEventId((curr) => (curr === eventId ? null : curr))
      showUndoToast(eventId)
    } catch {
      // тихо
    }
  }

  async function undoDelete(eventId: string) {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToastUndoEventId(null)
    try {
      const res = await fetch(`/api/action-events/${eventId}/undo`, { method: 'POST' })
      if (!res.ok) return
      router.refresh()
    } catch {
      // тихо
    }
  }

  function openEditEvent(event: EventItem) {
    setEditingEventId(event.id)
    setEditEventActionId(event.objectActionId ?? actions[0]?.id ?? null)
  }

  async function saveEditedEvent(eventId: string) {
    if (!editEventActionId) return
    try {
      const res = await fetch(`/api/action-events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectActionId: editEventActionId }),
      })
      if (!res.ok) return
      setEditingEventId(null)
      setEditEventActionId(null)
      router.refresh()
    } catch {
      // тихо
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* === Действия === */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div>
            <div className="filtersPanelLabel">Действия</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Нажмите на эмодзи — запись добавится</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAction((v) => !v)}
            className="btnIcon btnIcon--accent"
          >
            {showAddAction ? '✕ Закрыть' : '+ Новое'}
          </button>
        </div>

        {showAddAction ? (
          <div style={{ marginBottom: 14, padding: '14px 16px', background: 'rgba(var(--ochreRgb), 0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(var(--ochreRgb), 0.15)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="fieldLabel">Название</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Кормление, Прогулка…"
                />
              </div>
              <div className="field" style={{ width: 90 }}>
                <label className="fieldLabel">Эмодзи</label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                />
              </div>
            </div>

            <div className="emojiPicker" style={{ marginTop: 10 }}>
              {emojiPresets.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setNewIcon(e)}
                  className={`emojiBtn${e === newIcon ? ' emojiBtn--active' : ''}`}
                >
                  {e}
                </button>
              ))}
            </div>

            {addError ? <div className="errorText" style={{ marginTop: 8 }}>{addError}</div> : null}

            <button
              type="button"
              onClick={createAction}
              disabled={adding || newLabel.trim().length < 2 || !newIcon.trim()}
              className="btnPrimary"
              style={{ marginTop: 12 }}
            >
              {adding ? 'Добавляем…' : 'Добавить действие'}
            </button>
          </div>
        ) : null}

        {actions.length === 0 ? (
          <div className="emptyState" style={{ padding: '24px 16px' }}>
            <span className="emptyStateIcon">✨</span>
            <p className="emptyStateText">Добавьте первое действие выше</p>
          </div>
        ) : (
          <div className="actionsGrid">
            {actions.map((a) => (
              <div key={a.id}>
                <button
                  type="button"
                  onClick={() => addEvent(a.id)}
                  className="actionTile"
                  style={{
                    width: '100%',
                    transform: pressedActionId === a.id ? 'scale(0.93)' : undefined,
                  }}
                >
                  <span className="actionTileIcon">{a.icon}</span>
                  <span className="actionTileLabel">{a.label}</span>
                </button>
                {a.createdById === currentUserId ? (
                  <div className="actionTileFooter">
                    <button
                      type="button"
                      onClick={() => openEditAction(a)}
                      className="btnIcon"
                      style={{ fontSize: 13 }}
                    >
                      ✎
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {editingAction ? (
          <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(var(--ochreRgb), 0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(var(--ochreRgb), 0.15)' }}>
            <div className="filtersPanelLabel" style={{ marginBottom: 10 }}>Редактировать действие</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="fieldLabel">Название</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </div>
              <div className="field" style={{ width: 90 }}>
                <label className="fieldLabel">Эмодзи</label>
                <input
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                />
              </div>
            </div>

            {editError ? <div className="errorText" style={{ marginTop: 8 }}>{editError}</div> : null}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={saveEditedAction} className="btnPrimary" style={{ flex: 1 }}>
                Сохранить
              </button>
              <button type="button" onClick={() => setEditingActionId(null)} className="btnGhost" style={{ flex: 1 }}>
                Отмена
              </button>
            </div>

            <button
              type="button"
              onClick={() => deleteAction(editingAction.id)}
              className="btnIcon btnIcon--danger"
              style={{ width: '100%', marginTop: 8, padding: '10px 14px' }}
            >
              Удалить действие
            </button>
          </div>
        ) : null}
      </div>

      {/* === История === */}
      <div className="card">
        <div className="filtersPanelLabel" style={{ marginBottom: 14 }}>История</div>

        {localEvents.length === 0 ? (
          <div className="emptyState" style={{ padding: '24px 16px' }}>
            <span className="emptyStateIcon">📜</span>
            <p className="emptyStateText">Пока пусто — нажмите на эмодзи выше</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {localEvents.map((ev) => {
              const isMine = ev.actorId === currentUserId
              const showEdit = editingEventId === ev.id
              return (
                <div key={ev.id} className="eventCard" style={{ flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span className="eventIcon" style={{ fontSize: 22 }}>{ev.iconSnapshot}</span>
                      <div className="eventBody">
                        <div className="eventLabel">
                          <span className="eventActor">{ev.actorName ?? '…'}</span> — {ev.labelSnapshot}
                        </div>
                        <div className="eventMeta">
                          {new Date(ev.occurredAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {isMine ? (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => openEditEvent(ev)}
                          className="btnIcon btnIcon--accent"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEvent(ev.id)}
                          className="btnIcon btnIcon--danger"
                        >
                          🗑
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {showEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="field">
                        <label className="fieldLabel">Изменить действие</label>
                        <select
                          value={editEventActionId ?? ''}
                          onChange={(e) => setEditEventActionId(e.target.value || null)}
                        >
                          {actions.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.icon} {a.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => saveEditedEvent(ev.id)}
                          className="btnPrimary"
                          style={{ flex: 1 }}
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingEventId(null); setEditEventActionId(null) }}
                          className="btnGhost"
                          style={{ flex: 1 }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toastUndoEventId ? (
        <div className="toast">
          <span style={{ fontSize: 14, color: 'var(--text)' }}>Запись удалена</span>
          <button
            type="button"
            onClick={() => undoDelete(toastUndoEventId)}
            className="btnIcon btnIcon--accent"
          >
            Отменить
          </button>
        </div>
      ) : null}
    </div>
  )
}
