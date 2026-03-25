import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const email = (session.user as any).email as string | undefined
  const normalizedEmail = email ? email.toLowerCase().trim() : undefined

  const invitations = await prisma.objectShareInvitation.findMany({
    where: {
      status: 'PENDING',
      OR: [{ invitedUserId: userId }, normalizedEmail ? { invitedEmail: normalizedEmail } : undefined].filter(
        Boolean,
      ) as any,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      objectCare: { select: { name: true, id: true } },
      inviter: { select: { name: true, id: true } },
      invitedEmail: true,
      permission: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ invitations })
}

