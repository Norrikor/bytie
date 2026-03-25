import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

const CreateEventSchema = z.object({
  objectActionId: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const actorId = (session.user as any).id as string | undefined
  if (!actorId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const member = await prisma.objectCareMember.findFirst({
    where: { objectCareId: params.objectId, userId: actorId, endedAt: null },
    select: { role: true },
  })
  const obj = await prisma.objectCare.findUnique({
    where: { id: params.objectId },
    select: { ownerId: true },
  })
  const canAdd = member !== null || obj?.ownerId === actorId
  if (!canAdd) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = CreateEventSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { objectActionId } = parsed.data

  const action = await prisma.objectAction.findUnique({
    where: { id: objectActionId },
    select: { id: true, objectCareId: true, label: true, icon: true },
  })
  if (!action || action.objectCareId !== params.objectId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const event = await prisma.actionEvent.create({
    data: {
      objectCareId: params.objectId,
      objectActionId,
      actorId,
      labelSnapshot: action.label,
      iconSnapshot: action.icon,
    },
    select: {
      id: true,
      occurredAt: true,
      actorId: true,
      objectCareId: true,
      objectActionId: true,
      labelSnapshot: true,
      iconSnapshot: true,
    },
  })

  return NextResponse.json({ event })
}

