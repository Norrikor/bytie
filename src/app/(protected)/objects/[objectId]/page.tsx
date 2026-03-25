import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getObjectCareOrThrow, assertIsOwner } from '@/lib/acl/objectCare'
import ObjectCareEditPanel from './ObjectCareEditPanel'
import { prisma } from '@/lib/db/prisma'
import ObjectCareInteractive from './ObjectCareInteractive'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export default async function ObjectCarePage({
  params,
}: {
  params: { objectId: string }
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

  const events = await prisma.actionEvent.findMany({
    where: { objectCareId: params.objectId, deletedAt: null },
    orderBy: { occurredAt: 'desc' },
    take: 30,
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
        <Link href="/objects" className="pageBackLink">← Назад</Link>
        <h1 style={{ margin: 0 }}>{obj.name}</h1>
      </div>

      {obj.kind ? (
        <p className="pageLead" style={{ marginTop: -12 }}>{obj.kind}</p>
      ) : null}

      <ObjectCareInteractive
        objectId={params.objectId}
        currentUserId={userId}
        actions={actions}
        events={events.map((e) => ({
          id: e.id,
          objectActionId: e.objectActionId,
          actorId: e.actorId,
          actorName: e.actor.name,
          occurredAt: e.occurredAt.toISOString(),
          labelSnapshot: e.labelSnapshot,
          iconSnapshot: e.iconSnapshot,
        }))}
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
