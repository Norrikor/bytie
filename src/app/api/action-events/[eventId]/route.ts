import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

const UpdateEventSchema = z.object({
  objectActionId: z.string().min(1),
})

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const event = await prisma.actionEvent.findUnique({
    where: { id: params.eventId },
    select: { id: true, actorId: true, objectCareId: true, deletedAt: true },
  })
  if (!event || event.deletedAt) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (event.actorId !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = UpdateEventSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { objectActionId } = parsed.data
  const action = await prisma.objectAction.findUnique({
    where: { id: objectActionId },
    select: { id: true, objectCareId: true, label: true, icon: true },
  })
  if (!action || action.objectCareId !== event.objectCareId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.actionEvent.update({
    where: { id: params.eventId },
    data: {
      objectActionId,
      labelSnapshot: action.label,
      iconSnapshot: action.icon,
      occurredAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
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
  if (!event || event.deletedAt) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (event.actorId !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await prisma.actionEvent.update({
    where: { id: params.eventId },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}

