'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import ActionEmojiField from '../../_components/ActionEmojiField'
import ActionEventCard from '../../_components/ActionEventCard'
import ConfirmDialog from '../../_components/ConfirmDialog'
import FeedPaginationBar from '../../_components/FeedPaginationBar'

type ConfirmDeleteTarget =
  | null
  | { kind: 'event'; eventId: string }
  | { kind: 'action'; actionId: string }

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
  occurredAtLabel: string
  labelSnapshot: string
  iconSnapshot: string
  showActor: boolean
}

export default function ObjectCareInteractive({
  objectId,
  currentUserId,
  actions,
  events,
  historyPagination,
  initialShowAddAction = false,
}: {
  objectId: string
  currentUserId: string
  actions: Action[]
  events: EventItem[]
  historyPagination: { currentPage: number; totalPages: number; totalCount: number }
  initialShowAddAction?: boolean
}) {
  const router = useRouter()
  const [navPending, startNav] = useTransition()

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

  const [showAddAction, setShowAddAction] = useState(initialShowAddAction)
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
  const [actionDeleteInFlight, setActionDeleteInFlight] = useState(false)
  const [eventDeleteInFlight, setEventDeleteInFlight] = useState<string | null>(null)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<ConfirmDeleteTarget>(null)

  const confirmDeleteCopy = useMemo(() => {
    if (!confirmDeleteTarget) return { title: '', message: '' }
    if (confirmDeleteTarget.kind === 'event') {
      return {
        title: 'Удалить запись из истории?',
        message:
          'Запись исчезнет из списка. Несколько секунд можно отменить через кнопку «Отменить» внизу экрана.',
      }
    }
    return {
      title: 'Удалить действие?',
      message:
        'Кнопка пропадёт из блока «Действия». Записи в истории останутся — с тем же эмодзи и названием.',
    }
  }, [confirmDeleteTarget])

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

  async function runDeleteAction(actionId: string) {
    if (actionDeleteInFlight) return
    setActionDeleteInFlight(true)
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
    } finally {
      setActionDeleteInFlight(false)
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

  async function runDeleteEvent(eventId: string) {
    if (eventDeleteInFlight) return
    setEventDeleteInFlight(eventId)
    try {
      const res = await fetch(`/api/action-events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) return

      setLocalEvents((prev) => prev.filter((e) => e.id !== eventId))
      setEditingEventId((curr) => (curr === eventId ? null : curr))
      showUndoToast(eventId)
      router.refresh()
    } catch {
      // тихо
    } finally {
      setEventDeleteInFlight(null)
    }
  }

  async function confirmDeleteExec() {
    if (!confirmDeleteTarget) return
    const t = confirmDeleteTarget
    setConfirmDeleteTarget(null)
    if (t.kind === 'event') await runDeleteEvent(t.eventId)
    else await runDeleteAction(t.actionId)
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
            <div className="field">
              <label className="fieldLabel">Название</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Кормление, Прогулка…"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <ActionEmojiField value={newIcon} onChange={setNewIcon} disabled={adding} />
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
            <div className="field">
              <label className="fieldLabel">Название</label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <ActionEmojiField value={editIcon} onChange={setEditIcon} />
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
              onClick={() => setConfirmDeleteTarget({ kind: 'action', actionId: editingAction.id })}
              disabled={actionDeleteInFlight}
              className="btnIcon btnIcon--danger"
              style={{ width: '100%', marginTop: 8, padding: '10px 14px' }}
            >
              {actionDeleteInFlight ? 'Удаляем…' : 'Удалить действие'}
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
          <div className="objectHistoryStack">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                opacity: navPending ? 0.65 : 1,
                transition: 'opacity 180ms ease',
              }}
            >
              {localEvents.map((ev) => {
                const isMine = ev.actorId === currentUserId
                const showEdit = editingEventId === ev.id
                const evDeleting = eventDeleteInFlight === ev.id
                return (
                  <div key={ev.id} className="eventScopedBlock">
                    <ActionEventCard
                      occurredAt={ev.occurredAt}
                      occurredAtLabel={ev.occurredAtLabel}
                      iconSnapshot={ev.iconSnapshot}
                      labelSnapshot={ev.labelSnapshot}
                      showObjectPill={false}
                      showActor={ev.showActor}
                      actorId={ev.actorId}
                      actorName={ev.actorName}
                      trailing={
                        isMine ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditEvent(ev)}
                              disabled={evDeleting}
                              className="btnIcon btnIcon--accent"
                              aria-label="Изменить запись"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTarget({ kind: 'event', eventId: ev.id })}
                              disabled={evDeleting}
                              className="btnIcon btnIcon--danger"
                              aria-label="Удалить запись"
                            >
                              {evDeleting ? '…' : '🗑'}
                            </button>
                          </>
                        ) : undefined
                      }
                    />

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
                            onClick={() => {
                              setEditingEventId(null)
                              setEditEventActionId(null)
                            }}
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

            <FeedPaginationBar
              currentPage={historyPagination.currentPage}
              totalPages={historyPagination.totalPages}
              totalCount={historyPagination.totalCount}
              disabled={navPending}
              onNavigate={(p) =>
                startNav(() => router.push(`/objects/${objectId}?page=${p}`))
              }
            />

            <p className="objectHistoryFeedLink">
              <Link href={`/feed?objectCareId=${encodeURIComponent(objectId)}&range=24h`} style={{ color: 'var(--ochre)' }}>
                Открыть в общей ленте
              </Link>
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteTarget !== null}
        title={confirmDeleteCopy.title}
        message={confirmDeleteCopy.message}
        cancelLabel="Отмена"
        confirmLabel={confirmDeleteTarget?.kind === 'event' ? 'Удалить запись' : 'Удалить действие'}
        danger
        onCancel={() => setConfirmDeleteTarget(null)}
        onConfirm={() => void confirmDeleteExec()}
      />

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
