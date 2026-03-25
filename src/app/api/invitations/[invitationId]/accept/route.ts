import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  _req: Request,
  { params }: { params: { invitationId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const email = (session.user as any).email as string | undefined
  const normalizedEmail = email ? email.toLowerCase().trim() : undefined

  const invitation = await prisma.objectShareInvitation.findUnique({
    where: { id: params.invitationId },
    select: {
      id: true,
      status: true,
      objectCareId: true,
      inviterId: true,
      invitedEmail: true,
      invitedUserId: true,
    },
  })
  if (!invitation || invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const allowed =
    invitation.invitedUserId === userId ||
    (!!normalizedEmail && invitation.invitedEmail.toLowerCase().trim() === normalizedEmail)
  if (!allowed) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await prisma.$transaction(async (tx) => {
    await tx.objectShareInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        invitedUserId: invitation.invitedUserId ?? userId,
      },
    })

    await tx.objectCareMember.upsert({
      where: {
        objectCareId_userId: { objectCareId: invitation.objectCareId, userId },
      },
      update: {
        endedAt: null,
        role: 'COLLABORATOR',
      },
      create: {
        objectCareId: invitation.objectCareId,
        userId,
        role: 'COLLABORATOR',
      },
    })
  })

  return NextResponse.json({ ok: true })
}

