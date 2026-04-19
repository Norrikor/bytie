'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import ActionEventCard from '../_components/ActionEventCard'
import FeedPaginationBar from '../_components/FeedPaginationBar'
import { FEED_RANGE_DEFAULT, FEED_RANGE_PRESETS } from '@/lib/feed/feedRange'

type ObjectItem = {
  id: string
  name: string
  actions: Array<{ id: string; label: string; icon: string }>
}

type EventItem = {
  id: string
  occurredAt: string
  occurredAtLabel: string
  iconSnapshot: string
  labelSnapshot: string
  actorId: string
  actorName: string | null
  objectCareName: string | null
  /** Показывать, кто нажал кнопку — только если у объекта больше одного участника */
  showActor: boolean
}

type Actor = { id: string; name: string | null }

type FeedClientProps = {
  objects: ObjectItem[]
  events: EventItem[]
  currentPage: number
  totalPages: number
  totalCount: number
  paginationBaseParams: string
  actorOptions: Actor[]
  activeRangeKey: string | null
  currentFilters: {
    from?: string
    to?: string
    start?: string
    end?: string
    objectCareId?: string
    objectActionId?: string
    actorId?: string
  }
  timeMode: 'range' | 'custom' | 'legacy'
  customFromDefault: string
  customToDefault: string
}

function mergeFeedParams(
  base: Pick<URLSearchParams, 'toString'>,
  updates: { set?: Record<string, string>; del?: string[] },
) {
  const p = new URLSearchParams(base.toString())
  p.delete('page')
  updates.del?.forEach((k) => p.delete(k))
  if (updates.set) {
    for (const [k, v] of Object.entries(updates.set)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
  }
  return p
}

type Option = { value: string; label: string }

function PopoverSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Option[]
}) {
  const [open, setOpen] = useState(false)
  const active = options.find((o) => o.value === value)

  return (
    <div className="field" style={{ position: 'relative' }}>
      <span className="fieldLabel">{label}</span>
      <button
        type="button"
        className="popoverSelectButton"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{active?.label ?? options[0]?.label ?? 'Выбрать'}</span>
        <span style={{ opacity: 0.6 }}>▾</span>
      </button>
      {open ? (
        <div className="popoverSelectMenu">
          {options.map((o) => (
            <button
              key={o.value || '__all'}
              type="button"
              className={`popoverSelectOption${o.value === value ? ' popoverSelectOptionActive' : ''}`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function FeedClient({
  objects,
  events,
  currentPage,
  totalPages,
  totalCount,
  paginationBaseParams,
  actorOptions,
  activeRangeKey,
  currentFilters,
  timeMode,
  customFromDefault,
  customToDefault,
}: FeedClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    objects.length === 1 ? objects[0].id : null,
  )
  const [pressedActionId, setPressedActionId] = useState<string | null>(null)
  const [loggedActionId, setLoggedActionId] = useState<string | null>(null)

  const selectedObject = objects.find((o) => o.id === selectedObjectId) ?? null

  async function logAction(objectId: string, actionId: string) {
    setPressedActionId(actionId)
    setLoggedActionId(null)

    try {
      const res = await fetch(`/api/objects/${objectId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectActionId: actionId }),
      })
      if (!res.ok) return

      setLoggedActionId(actionId)
      setTimeout(() => setLoggedActionId(null), 1200)
      startTransition(() => router.refresh())
    } catch {
      // тихо
    } finally {
      setTimeout(() => setPressedActionId(null), 200)
    }
  }

  const [showFilters, setShowFilters] = useState(false)
  const [filterObjectId, setFilterObjectId] = useState(currentFilters.objectCareId ?? '')
  const [filterActionId, setFilterActionId] = useState(currentFilters.objectActionId ?? '')
  const [filterActorId, setFilterActorId] = useState(currentFilters.actorId ?? '')
  const [fromInput, setFromInput] = useState(customFromDefault)
  const [toInput, setToInput] = useState(customToDefault)
  const [startInput, setStartInput] = useState(currentFilters.start ?? '')
  const [endInput, setEndInput] = useState(currentFilters.end ?? '')

  const hasActiveFilters = !!(
    currentFilters.objectCareId ||
    currentFilters.objectActionId ||
    currentFilters.actorId ||
    (activeRangeKey && activeRangeKey !== FEED_RANGE_DEFAULT) ||
    timeMode === 'custom' ||
    timeMode === 'legacy'
  )

  const filterObject = useMemo(
    () => objects.find((o) => o.id === filterObjectId),
    [objects, filterObjectId],
  )
  const actionOptions: Option[] = [
    { value: '', label: 'Любое' },
    ...((filterObject?.actions ?? []).map((a) => ({
      value: a.id,
      label: `${a.icon} ${a.label}`,
    }))),
  ]
  const objectOptions: Option[] = [
    { value: '', label: 'Всё' },
    ...objects.map((o) => ({ value: o.id, label: o.name })),
  ]
  const actorOptionsSelect: Option[] = [
    { value: '', label: 'Все' },
    ...actorOptions.map((a) => ({ value: a.id, label: a.name ?? '…' })),
  ]

  function hrefForPreset(rangeId: string) {
    const p = mergeFeedParams(searchParams, {
      del: ['from', 'to', 'start', 'end', 'cursor'],
      set: { range: rangeId },
    })
    return `/feed?${p.toString()}`
  }

  function applyFilters() {
    const p = mergeFeedParams(searchParams, { del: ['cursor'] })

    const objectCareId = filterObjectId
    const objectActionId = filterActionId
    const actorId = filterActorId

    if (timeMode === 'legacy') {
      const start = startInput
      const end = endInput
      p.delete('range')
      p.delete('from')
      p.delete('to')
      if (start) p.set('start', start)
      else p.delete('start')
      if (end) p.set('end', end)
      else p.delete('end')
    } else {
      const from = fromInput
      const to = toInput
      if (from && to) {
        p.delete('range')
        p.delete('start')
        p.delete('end')
        p.set('from', from)
        p.set('to', to)
      } else if (activeRangeKey) {
        p.delete('from')
        p.delete('to')
        p.delete('start')
        p.delete('end')
        p.set('range', activeRangeKey)
      } else {
        p.set('range', FEED_RANGE_DEFAULT)
      }
    }

    if (objectCareId) p.set('objectCareId', objectCareId)
    else p.delete('objectCareId')
    if (objectActionId) p.set('objectActionId', objectActionId)
    else p.delete('objectActionId')
    if (actorId) p.set('actorId', actorId)
    else p.delete('actorId')

    p.set('page', '1')
    startTransition(() => router.push(`/feed?${p.toString()}`))
  }

  function goToPage(page: number) {
    const safe = Math.min(Math.max(page, 1), totalPages)
    const p = new URLSearchParams(paginationBaseParams)
    p.set('page', String(safe))
    startTransition(() => router.push(`/feed?${p.toString()}`))
  }

  return (
    <div className="pageSection">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <h1>Лента</h1>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`filterToggleBtn${hasActiveFilters ? ' filterToggleBtn--active' : ''}`}
        >
          <span>⚙</span>
          <span>{hasActiveFilters ? 'Фильтр' : 'Фильтры'}</span>
          {hasActiveFilters ? (
            <Link
              href="/feed"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 12, opacity: 0.7, textDecoration: 'underline' }}
            >
              сбросить
            </Link>
          ) : null}
        </button>
      </div>

      {showFilters ? (
        <div className="filtersCompact">
          <div className="filtersPanelLabel" style={{ marginBottom: 4 }}>Период</div>
          <div className="quickObjectTabs" style={{ marginBottom: 4 }}>
            {FEED_RANGE_PRESETS.map(({ id, label }) => (
              <Link
                key={id}
                href={hrefForPreset(id)}
                className={`quickObjectTab${activeRangeKey === id ? ' quickObjectTab--active' : ''}`}
                scroll={false}
              >
                {label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timeMode === 'legacy' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label className="fieldLabel" htmlFor="lfstart">С (дата)</label>
                  <input
                    id="lfstart"
                    type="date"
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label className="fieldLabel" htmlFor="lfend">По (дата)</label>
                  <input
                    id="lfend"
                    type="date"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="fieldLabel" htmlFor="lffrom">С (дата и время)</label>
                  <input
                    id="lffrom"
                    type="datetime-local"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                  />
                </div>
                <div className="field" style={{ flex: 1, minWidth: 140 }}>
                  <label className="fieldLabel" htmlFor="lfto">По</label>
                  <input
                    id="lfto"
                    type="datetime-local"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.35 }}>
              Пресеты — от «сейчас» назад. Чтобы зафиксировать свои даты, заполните поля «С» и «По» и нажмите «Применить».
              Без них кнопка сохранит выбранный выше пресет и остальные фильтры.
            </p>

            <PopoverSelect
              label="Объект"
              value={filterObjectId}
              options={objectOptions}
              onChange={(v) => {
                setFilterObjectId(v)
                setFilterActionId('')
              }}
            />

            {filterObject && filterObject.actions.length > 0 ? (
              <PopoverSelect
                label="Действие"
                value={filterActionId}
                options={actionOptions}
                onChange={setFilterActionId}
              />
            ) : null}

            {actorOptions.length > 1 ? (
              <PopoverSelect
                label="Кто"
                value={filterActorId}
                options={actorOptionsSelect}
                onChange={setFilterActorId}
              />
            ) : null}

            <button type="button" onClick={applyFilters} className="btnPrimary" disabled={isPending}>
              {isPending ? '…' : 'Применить фильтры'}
            </button>
          </div>
        </div>
      ) : null}

      {objects.length > 0 ? (
        <div className="card" style={{ gap: 12, display: 'flex', flexDirection: 'column', padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Отметить сейчас
          </div>

          {objects.length > 1 ? (
            <div className="quickObjectTabs">
              {objects.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedObjectId(o.id === selectedObjectId ? null : o.id)}
                  className={`quickObjectTab${o.id === selectedObjectId ? ' quickObjectTab--active' : ''}`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--textSoft)', fontWeight: 500 }}>
              {objects[0].name}
            </div>
          )}

          {selectedObject ? (
            selectedObject.actions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
                Нет действий —{' '}
                <Link href={`/objects/${selectedObject.id}`} style={{ color: 'var(--ochre)', textDecoration: 'underline' }}>
                  добавить
                </Link>
              </div>
            ) : (
              <div className="quickActionsRow">
                {selectedObject.actions.map((a) => {
                  const isPressed = pressedActionId === a.id
                  const isLogged = loggedActionId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={isPending || pressedActionId !== null}
                      onClick={() => logAction(selectedObject.id, a.id)}
                      className={`quickActionBtn${isPressed || isLogged ? ' quickActionBtn--pressed' : ''}`}
                    >
                      <span className="quickActionBtnIcon">
                        {isLogged ? '✓' : a.icon}
                      </span>
                      <span className="quickActionBtnLabel">{a.label}</span>
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Выберите объект выше
            </div>
          )}
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="emptyState">
          <span className="emptyStateIcon">🌿</span>
          <p className="emptyStateText">
            За выбранный период пока тихо.<br />
            Смените срок выше или отметьте действие.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: isPending ? 0.6 : 1, transition: 'opacity 200ms' }}>
            {events.map((ev) => (
              <ActionEventCard
                key={ev.id}
                occurredAt={ev.occurredAt}
                occurredAtLabel={ev.occurredAtLabel}
                iconSnapshot={ev.iconSnapshot}
                labelSnapshot={ev.labelSnapshot}
                objectCareName={ev.objectCareName}
                showObjectPill
                showActor={ev.showActor}
                actorId={ev.actorId}
                actorName={ev.actorName}
              />
            ))}
          </div>

          <FeedPaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            disabled={isPending}
            onNavigate={(p) => goToPage(p)}
          />
        </>
      )}
    </div>
  )
}
