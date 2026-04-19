import { redirect } from 'next/navigation'

import PageBackLink from '@/components/ui/PageBackLink'
import { getObjectCareOrThrow, assertIsOwner } from '@/lib/acl/objectCare'
import ObjectCareEditPanel from './ObjectCareEditPanel'
import { prisma } from '@/lib/db/prisma'
import ObjectCareInteractive from './ObjectCareInteractive'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { formatEventOccurredAtLabel } from '@/lib/feed/eventDateLabel'

const PAGE_SIZE = 20

function getFirst(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

export default async function ObjectCarePage({
  params,
  searchParams,
}: {
  params: { objectId: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  const userId = current.user.id

  const obj = await getObjectCareOrThrow(userId, params.objectId)
  if (!obj) redirect('/objects')

  const isOwner = await assertIsOwner(userId, params.objectId)

  const actions = await prisma.objectAction.findMany({
    where: { objectCareId: params.objectId },
    orderBy: { sortIndex: 'asc' },
    select: { id: true, label: true, icon: true, color: true, createdById: true },
  })

  const totalCount = await prisma.actionEvent.count({
    where: { objectCareId: params.objectId, deletedAt: null },
  })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pageRaw = getFirst(searchParams.page)
  const requestedPage = Number.parseInt(pageRaw ?? '1', 10)
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(requestedPage, 1), totalPages)
  const skip = (currentPage - 1) * PAGE_SIZE

  const memberCount = await prisma.objectCareMember.count({
    where: { objectCareId: params.objectId, endedAt: null },
  })
  const showActorForObject = memberCount > 1

  const openAddActionRaw = getFirst(searchParams.addAction)
  const openAddAction = openAddActionRaw === '1' || openAddActionRaw === 'true'

  const events = await prisma.actionEvent.findMany({
    where: { objectCareId: params.objectId, deletedAt: null },
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      objectActionId: true,
      actorId: true,
      occurredAt: true,
      labelSnapshot: true,
      iconSnapshot: true,
      actor: { select: { name: true } },
    },
  })

  return (
    <div className="pageSection">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PageBackLink href="/objects">← Назад</PageBackLink>
        <h1 style={{ margin: 0 }}>{obj.name}</h1>
      </div>

      {obj.kind ? (
        <p className="pageLead" style={{ marginTop: -12 }}>{obj.kind}</p>
      ) : null}

      <ObjectCareInteractive
        objectId={params.objectId}
        currentUserId={userId}
        actions={actions}
        initialShowAddAction={openAddAction}
        events={events.map((e) => ({
          id: e.id,
          objectActionId: e.objectActionId,
          actorId: e.actorId,
          actorName: e.actor.name,
          occurredAt: e.occurredAt.toISOString(),
          occurredAtLabel: formatEventOccurredAtLabel(e.occurredAt),
          labelSnapshot: e.labelSnapshot,
          iconSnapshot: e.iconSnapshot,
          showActor: showActorForObject,
        }))}
        historyPagination={{
          currentPage,
          totalPages,
          totalCount,
        }}
      />

      {isOwner ? (
        <details className="detailsManage">
          <summary>Управление</summary>
          <div style={{ paddingTop: 12 }}>
            <ObjectCareEditPanel objectId={obj.id} initialName={obj.name} isOwner={true} />
          </div>
        </details>
      ) : null}
    </div>
  )
}
