import Link from 'next/link'
import { redirect } from 'next/navigation'

import PageBackLink from '@/components/ui/PageBackLink'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

function getFirst(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

function parseDateParam(dateStr: string | undefined) {
  if (!dateStr) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T00:00:00.000Z`)
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default async function PeoplePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.name) redirect('/onboarding/1')

  const viewerId = (session.user as any)?.id as string | undefined
  if (!viewerId) redirect('/login')

  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true },
  })

  const startStr = getFirst(searchParams.start)
  const endStr = getFirst(searchParams.end)
  const objectCareIdFilter = getFirst(searchParams.objectCareId)
  const objectActionIdFilter = getFirst(searchParams.objectActionId)
  const cursorRaw = getFirst(searchParams.cursor)

  const startDate = parseDateParam(startStr)
  const endDateBase = parseDateParam(endStr)
  const endDate = endDateBase ? new Date(endDateBase.getTime() + 24 * 60 * 60 * 1000 - 1) : undefined

  const accessibleObjects = await prisma.objectCareMember.findMany({
    where: { userId: viewerId, endedAt: null },
    select: { objectCareId: true, objectCare: { select: { id: true, name: true } } },
  })
  const accessibleObjectCareIds = accessibleObjects.map((m) => m.objectCareId)

  const objectFilterOk =
    objectCareIdFilter ? accessibleObjectCareIds.includes(objectCareIdFilter) : true

  const cursorParts = cursorRaw ? cursorRaw.split('|') : undefined
  const cursorAt = cursorParts?.[0] ? new Date(Number(cursorParts[0])) : undefined
  const cursorId = cursorParts?.[1]

  const where: any = {
    deletedAt: null,
    actorId: params.userId,
    objectCareId: { in: objectFilterOk ? (objectCareIdFilter ? [objectCareIdFilter] : accessibleObjectCareIds) : [] },
  }
  if (objectActionIdFilter) where.objectActionId = objectActionIdFilter
  if (startDate || endDate) {
    where.occurredAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    }
  }
  if (cursorAt && cursorId) {
    where.OR = [{ occurredAt: { lt: cursorAt } }, { occurredAt: cursorAt, id: { lt: cursorId } }]
  }

  const [actionsForObject, events] = await Promise.all([
    objectCareIdFilter
      ? prisma.objectAction.findMany({
          where: { objectCareId: objectCareIdFilter },
          orderBy: { sortIndex: 'asc' },
          select: { id: true, label: true, icon: true },
        })
      : Promise.resolve([]),
    prisma.actionEvent.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: 20,
      select: {
        id: true,
        occurredAt: true,
        iconSnapshot: true,
        labelSnapshot: true,
        objectCare: { select: { id: true, name: true } },
      },
    }),
  ])

  const nextCursor =
    events.length > 0
      ? encodeURIComponent(`${events[events.length - 1].occurredAt.getTime()}|${events[events.length - 1].id}`)
      : undefined

  const isSelf = params.userId === viewerId

  return (
    <div className="pageSection">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PageBackLink href="/feed">← Лента</PageBackLink>
        <h1 style={{ margin: 0 }}>
          {isSelf ? 'Моя история' : (targetUser?.name ? `История: ${targetUser.name}` : 'История')}
        </h1>
      </div>

      <div className="filtersPanel">
        <div className="filtersPanelLabel">Фильтры</div>
        <form method="GET" action={`/people/${params.userId}`} className="form" style={{ gap: 12 }}>
          <div className="formRow">
            <div className="field" style={{ flex: 1 }}>
              <label className="fieldLabel">С</label>
              <input type="date" name="start" defaultValue={startStr ?? ''} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="fieldLabel">По</label>
              <input type="date" name="end" defaultValue={endStr ?? ''} />
            </div>
          </div>

          <div className="field">
            <label className="fieldLabel">Объект</label>
            <select name="objectCareId" defaultValue={objectCareIdFilter ?? ''}>
              <option value="">Всё</option>
              {accessibleObjects.map((o) => (
                <option key={o.objectCareId} value={o.objectCareId}>
                  {o.objectCare.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="fieldLabel">Действие</label>
            <select
              name="objectActionId"
              defaultValue={objectActionIdFilter ?? ''}
              disabled={!objectCareIdFilter}
              style={{ opacity: objectCareIdFilter ? 1 : 0.5 }}
            >
              <option value="">Любое</option>
              {actionsForObject.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btnPrimary">Применить</button>
        </form>
      </div>

      {events.length === 0 ? (
        <div className="emptyState">
          <span className="emptyStateIcon">📜</span>
          <p className="emptyStateText">Пока здесь тихо.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((ev) => (
            <div key={ev.id} className="eventCard">
              <span className="eventIcon">{ev.iconSnapshot}</span>
              <div className="eventBody">
                <div className="eventLabel">{ev.labelSnapshot}</div>
                <div className="eventMeta">
                  {ev.objectCare.name} · {new Date(ev.occurredAt).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {nextCursor ? (
        <Link
          href={`/people/${params.userId}?start=${encodeURIComponent(startStr ?? '')}&end=${encodeURIComponent(endStr ?? '')}&objectCareId=${encodeURIComponent(
            objectCareIdFilter ?? '',
          )}&objectActionId=${encodeURIComponent(objectActionIdFilter ?? '')}&cursor=${nextCursor}`}
          className="btnGhost"
        >
          Показать ещё
        </Link>
      ) : null}
    </div>
  )
}
