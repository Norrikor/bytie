'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import ActionEventCard from '../_components/ActionEventCard'
import FeedPaginationBar from '../_components/FeedPaginationBar'
import DateTimePicker from '@/components/ui/DateTimePicker'
import PopoverSelect from '@/components/ui/PopoverSelect'
import Tooltip from '@/components/ui/Tooltip'
import { FEED_RANGE_DEFAULT } from '@/lib/feed/feedRange'
import TimePresets from '@/components/ui/TimePresets'
import { FEED_TIME_PRESETS, type TimePresetKey } from '@/lib/filters/timePresets'

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
  /** UTC ISO из query (custom-период) */
  customFromUtcIso: string
  customToUtcIso: string
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
  customFromUtcIso,
  customToUtcIso,
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
  const [fromIso, setFromIso] = useState(customFromUtcIso)
  const [toIso, setToIso] = useState(customToUtcIso)

  useEffect(() => {
    setFromIso(customFromUtcIso)
    setToIso(customToUtcIso)
  }, [customFromUtcIso, customToUtcIso])
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
      const from = fromIso.trim()
      const to = toIso.trim()
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
          <Tooltip
            variant="panel"
            title="Как задаётся период"
            leading={<span className="filtersPanelLabel">Период</span>}
          >
            <p>
              Кнопки периода считают интервал от текущего момента назад. Чтобы задать свой диапазон по датам,
              заполните поля «С» и «По» целиком и нажмите «Применить фильтры»: тогда используются эти границы, пресет
              отключается.
            </p>
            <p>
              Если хотя бы одно поле пустое, при применении остаётся выбранный пресет (или период по умолчанию), а
              объект, действие и остальные фильтры всё равно сохраняются.
            </p>
          </Tooltip>

          <div className="quickObjectTabs" style={{ marginBottom: 4 }}>
            <TimePresets
              presets={FEED_TIME_PRESETS}
              paramKey="range"
              activeKey={(activeRangeKey as TimePresetKey) ?? null}
            />
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
                <div style={{ flex: 1, minWidth: 200 }}>
                  <DateTimePicker
                    id="lffrom"
                    label="С (дата и время)"
                    mode="datetime"
                    valueUtcIso={fromIso}
                    onChangeUtcIso={setFromIso}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <DateTimePicker
                    id="lfto"
                    label="По"
                    mode="datetime"
                    valueUtcIso={toIso}
                    onChangeUtcIso={setToIso}
                  />
                </div>
              </div>
            )}

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
              <Link href="/objects" className="quickObjectTab quickObjectTab--active" scroll={false}>
                + добавить
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, color: 'var(--textSoft)', fontWeight: 500 }}>{objects[0].name}</div>
              <Link href="/objects" className="quickObjectTab quickObjectTab--active" scroll={false}>
                + добавить
              </Link>
            </div>
          )}

          {selectedObject ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/objects/${selectedObject.id}`} className="btnIcon btnIcon--accent" style={{ width: 'auto' }}>
                  {selectedObject.actions.length > 0 ? 'Подробнее' : 'Настройки'}
                </Link>
                <Link
                  href={`/objects/${selectedObject.id}?addAction=1`}
                  className="btnGhost"
                  style={{ width: 'auto' }}
                >
                  + Действие
                </Link>
              </div>

              {selectedObject.actions.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
                  Пока нет действий. Добавьте первое и потом нажимайте его отсюда.
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
                        <span className="quickActionBtnIcon">{isLogged ? '✓' : a.icon}</span>
                        <span className="quickActionBtnLabel">{a.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}
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
