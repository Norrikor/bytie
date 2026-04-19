import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import SharedClient from './SharedClient'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isSharedSectionEnabled } from '@/lib/featureFlags'

export default async function SharedPage() {
  if (!isSharedSectionEnabled()) redirect('/feed')

  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  const userId = current.user.id
  if (!userId) redirect('/login')

  const myMemberships = await prisma.objectCareMember.findMany({
    where: { userId, endedAt: null },
    select: {
      objectCareId: true,
      role: true,
      objectCare: { select: { id: true, name: true, kind: true } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const objects = await Promise.all(
    myMemberships.map(async (m) => {
      const members = await prisma.objectCareMember.findMany({
        where: { objectCareId: m.objectCareId, endedAt: null },
        select: {
          userId: true,
          role: true,
          user: { select: { name: true } },
        },
        orderBy: { joinedAt: 'asc' },
      })

      const pendingInvitations = await prisma.objectShareInvitation.findMany({
        where: { objectCareId: m.objectCareId, inviterId: userId, status: 'PENDING' },
        select: { id: true, invitedEmail: true, invitedUserId: true },
        orderBy: { createdAt: 'desc' },
      })

      return {
        objectId: m.objectCareId,
        objectName: m.objectCare.name,
        kind: m.objectCare.kind,
        meRole: m.role,
        members: members.map((mm) => ({
          userId: mm.userId,
          name: mm.user.name,
        })),
        pendingInvitations: pendingInvitations.map((pi) => ({
          id: pi.id,
          invitedEmail: pi.invitedEmail,
          invitedUserId: pi.invitedUserId,
        })),
      }
    }),
  )

  return (
    <div className="pageSection">
      <div className="pageHeader">
        <h1>Вместе</h1>
        <p className="pageLead">Объекты, которыми вы делитесь с близкими. Оба видите ленту, оба вносите записи.</p>
      </div>

      <SharedClient objects={objects} currentUserId={userId} />
    </div>
  )
}
