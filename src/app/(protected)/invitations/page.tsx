import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import InvitationsClient from './InvitationsClient'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export default async function InvitationsPage() {
  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  const userId = current.user.id
  const email = current.user.email as string | undefined
  if (!userId || !email) redirect('/login')

  const normalizedEmail = email.toLowerCase().trim()

  const invitations = await prisma.objectShareInvitation.findMany({
    where: {
      status: 'PENDING',
      OR: [{ invitedUserId: userId }, { invitedEmail: normalizedEmail }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      objectCareId: true,
      invitedEmail: true,
      permission: true,
      createdAt: true,
      objectCare: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  })

  return (
    <div className="pageSection">
      <div className="pageHeader">
        <h1>Приглашения</h1>
        <p className="pageLead">Примите — и объект появится в вашей общей ленте.</p>
      </div>

      <InvitationsClient
        invitations={invitations.map((inv) => ({
          id: inv.id,
          objectCareId: inv.objectCareId,
          objectCareName: inv.objectCare.name,
          inviterName: inv.inviter?.name ?? null,
          invitedEmail: inv.invitedEmail,
          permission: inv.permission,
          createdAt: inv.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
