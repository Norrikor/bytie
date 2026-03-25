import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const event = await prisma.actionEvent.findUnique({
    where: { id: params.eventId },
    select: { id: true, actorId: true, deletedAt: true },
  })
  if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (event.actorId !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  if (!event.deletedAt) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })

  await prisma.actionEvent.update({
    where: { id: params.eventId },
    data: { deletedAt: null },
  })

  return NextResponse.json({ ok: true })
}

