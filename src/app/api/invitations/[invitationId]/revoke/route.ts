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

  const invitation = await prisma.objectShareInvitation.findUnique({
    where: { id: params.invitationId },
    select: { id: true, status: true, inviterId: true },
  })

  if (!invitation || invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (invitation.inviterId !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await prisma.objectShareInvitation.update({
    where: { id: invitation.id },
    data: { status: 'REVOKED', revokedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}

