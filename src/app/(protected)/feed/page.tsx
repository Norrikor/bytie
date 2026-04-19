import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { formatEventOccurredAtLabel } from '@/lib/feed/eventDateLabel'
import { FEED_RANGE_DEFAULT, FEED_RANGE_MS } from '@/lib/feed/feedRange'
import FeedClient from './FeedClient'

const PAGE_SIZE = 20

function getFirst(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

function parseDateOnly(dateStr: string | undefined) {
  if (!dateStr) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T00:00:00.000Z`)
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** datetime-local или ISO */
function parseDateTimeInput(s: string | undefined) {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day}T${h}:${min}`
}

function searchParamsToURLSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const p = new URLSearchParams()
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (v) p.append(key, v)
      })
    } else if (val) {
      p.set(key, val)
    }
  }
  return p
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  const userId = current.user.id

  const rangeRaw = getFirst(searchParams.range)
  const fromStr = getFirst(searchParams.from)
  const toStr = getFirst(searchParams.to)
  const startStr = getFirst(searchParams.start)
  const endStr = getFirst(searchParams.end)
  const objectCareIdFilter = getFirst(searchParams.objectCareId)
  const objectActionIdFilter = getFirst(searchParams.objectActionId)
  const actorIdFilter = getFirst(searchParams.actorId)
  const pageRaw = getFirst(searchParams.page)

  const hasCustomRange = !!(fromStr && toStr)
  const hasLegacyDates = !!(startStr || endStr)
  const hasRangeParam = !!(rangeRaw && FEED_RANGE_MS[rangeRaw])
  const hasTimeFilter = hasCustomRange || hasLegacyDates || hasRangeParam

  // Первый заход без периода — по умолчанию 24 ч (сохраняем остальные query)
  if (!hasTimeFilter && !pageRaw) {
    const p = searchParamsToURLSearchParams(searchParams)
    p.set('range', FEED_RANGE_DEFAULT)
    redirect(`/feed?${p.toString()}`)
  }

  const now = new Date()
  let startDate: Date | undefined
  let endDate: Date | undefined
  let activeRangeKey: string | null = null
  let timeMode: 'range' | 'custom' | 'legacy' = 'range'

  if (hasCustomRange) {
    timeMode = 'custom'
    startDate = parseDateTimeInput(fromStr)
    endDate = parseDateTimeInput(toStr)
    if (!startDate || !endDate) {
      startDate = undefined
      endDate = undefined
    }
  } else if (hasLegacyDates) {
    timeMode = 'legacy'
    startDate = parseDateOnly(startStr)
    const endDateBase = parseDateOnly(endStr)
    endDate = endDateBase ? new Date(endDateBase.getTime() + 24 * 60 * 60 * 1000 - 1) : undefined
  } else if (hasRangeParam && rangeRaw) {
    timeMode = 'range'
    activeRangeKey = rangeRaw
    const ms = FEED_RANGE_MS[rangeRaw]
    startDate = new Date(now.getTime() - ms)
    endDate = now
  }

  if (hasCustomRange && (!startDate || !endDate)) {
    const p = searchParamsToURLSearchParams(searchParams)
    p.delete('from')
    p.delete('to')
    p.set('range', FEED_RANGE_DEFAULT)
    redirect(`/feed?${p.toString()}`)
  }

  // Все объекты пользователя + их действия
  const baseMemberships = await prisma.objectCareMember.findMany({
    where: { userId, endedAt: null },
    include: {
      objectCare: {
        select: {
          id: true,
          name: true,
          actions: {
            orderBy: { sortIndex: 'asc' },
            select: { id: true, label: true, icon: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const objectCareIds = baseMemberships.map((m) => m.objectCare.id)
  if (objectCareIds.length === 0) redirect('/onboarding/2')

  const memberCountsByObject = await prisma.objectCareMember.groupBy({
    by: ['objectCareId'],
    where: { objectCareId: { in: objectCareIds }, endedAt: null },
    _count: { _all: true },
  })
  const objectHasMultipleMembers = new Map<string, boolean>()
  for (const row of memberCountsByObject) {
    objectHasMultipleMembers.set(row.objectCareId, row._count._all > 1)
  }

  const hasAnyEvents = await prisma.actionEvent.count({
    where: { actorId: userId, deletedAt: null },
  })
  if (hasAnyEvents === 0) {
    const onboardingObjectCareId = objectCareIds[0]
    const onboardingActionsCount = await prisma.objectAction.count({
      where: { objectCareId: onboardingObjectCareId },
    })
    if (onboardingActionsCount === 0) redirect('/onboarding/3')

    const onboardingEventsCount = await prisma.actionEvent.count({
      where: { objectCareId: onboardingObjectCareId, actorId: userId, deletedAt: null },
    })
    if (onboardingEventsCount === 0) redirect('/onboarding/4')
  }

  const objectCareFilterOk =
    objectCareIdFilter ? objectCareIds.includes(objectCareIdFilter) : true

  const allowedObjectCareIds = objectCareFilterOk && objectCareIdFilter
    ? [objectCareIdFilter]
    : objectCareIds

  const where: any = {
    deletedAt: null,
    objectCareId: { in: allowedObjectCareIds },
  }
  if (objectActionIdFilter) where.objectActionId = objectActionIdFilter
  if (actorIdFilter) where.actorId = actorIdFilter
  if (startDate || endDate) {
    where.occurredAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    }
  }
  const totalCount = await prisma.actionEvent.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const requestedPage = Number.parseInt(pageRaw ?? '1', 10)
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(requestedPage, 1), totalPages)
  const skip = (currentPage - 1) * PAGE_SIZE

  const events = await prisma.actionEvent.findMany({
    where,
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      occurredAt: true,
      iconSnapshot: true,
      labelSnapshot: true,
      actorId: true,
      objectCareId: true,
      actor: { select: { name: true } },
      objectCare: { select: { name: true } },
    },
  })

  const actorsInPage = Array.from(
    new Map(events.map((e) => [e.actorId, { id: e.actorId, name: e.actor?.name ?? null }])).values(),
  )
  const currentActorOption =
    actorIdFilter && !actorsInPage.find((a) => a.id === actorIdFilter)
      ? [{ id: actorIdFilter, name: null }]
      : []
  const actorOptions = [...actorsInPage, ...currentActorOption]

  const paramsForPagination = new URLSearchParams()
  if (rangeRaw && FEED_RANGE_MS[rangeRaw]) paramsForPagination.set('range', rangeRaw)
  if (fromStr) paramsForPagination.set('from', fromStr)
  if (toStr) paramsForPagination.set('to', toStr)
  if (startStr) paramsForPagination.set('start', startStr)
  if (endStr) paramsForPagination.set('end', endStr)
  if (objectCareIdFilter) paramsForPagination.set('objectCareId', objectCareIdFilter)
  if (objectActionIdFilter) paramsForPagination.set('objectActionId', objectActionIdFilter)
  if (actorIdFilter) paramsForPagination.set('actorId', actorIdFilter)
  if (!paramsForPagination.has('range') && !paramsForPagination.has('from') && !paramsForPagination.has('start')) {
    paramsForPagination.set('range', FEED_RANGE_DEFAULT)
  }

  const customFromDefault =
    timeMode === 'custom' && startDate && endDate ? toDatetimeLocalValue(startDate) : ''
  const customToDefault =
    timeMode === 'custom' && startDate && endDate ? toDatetimeLocalValue(endDate) : ''

  return (
    <FeedClient
        objects={baseMemberships.map((m) => ({
          id: m.objectCare.id,
          name: m.objectCare.name,
          actions: m.objectCare.actions,
        }))}
        events={events.map((ev) => ({
          id: ev.id,
          occurredAt: ev.occurredAt.toISOString(),
          occurredAtLabel: formatEventOccurredAtLabel(ev.occurredAt),
          iconSnapshot: ev.iconSnapshot,
          labelSnapshot: ev.labelSnapshot,
          actorId: ev.actorId,
          actorName: ev.actor?.name ?? null,
          objectCareName: ev.objectCare?.name ?? null,
          showActor: objectHasMultipleMembers.get(ev.objectCareId) ?? false,
        }))}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        paginationBaseParams={paramsForPagination.toString()}
        actorOptions={actorOptions}
        activeRangeKey={activeRangeKey}
        currentFilters={{
          from: fromStr,
          to: toStr,
          start: startStr,
          end: endStr,
          objectCareId: objectCareIdFilter,
          objectActionId: objectActionIdFilter,
          actorId: actorIdFilter,
        }}
        timeMode={timeMode}
        customFromDefault={customFromDefault}
        customToDefault={customToDefault}
      />
  )
}
