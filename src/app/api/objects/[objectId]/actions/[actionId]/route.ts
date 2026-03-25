import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { userCanReadObjectCare } from '@/lib/acl/objectCare'

const UpdateActionSchema = z.object({
  label: z.string().min(2).max(40).trim().optional(),
  icon: z.string().min(1).max(8).trim().optional(),
  color: z.string().max(32).trim().nullable().optional(),
  sortIndex: z.number().int().min(0).max(100000).optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { objectId: string; actionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const action = await prisma.objectAction.findUnique({
    where: { id: params.actionId },
    select: { id: true, objectCareId: true, createdById: true },
  })
  if (!action || action.objectCareId !== params.objectId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (action.createdById !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const canRead = await userCanReadObjectCare(userId, params.objectId)
  if (!canRead) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = UpdateActionSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { label, icon, color, sortIndex } = parsed.data

  const updated = await prisma.objectAction.update({
    where: { id: params.actionId },
    data: {
      label: label ?? undefined,
      icon: icon ?? undefined,
      color: color === undefined ? undefined : color,
      sortIndex: sortIndex ?? undefined,
    },
    select: { id: true, label: true, icon: true, color: true, createdById: true },
  })

  return NextResponse.json({ action: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { objectId: string; actionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const action = await prisma.objectAction.findUnique({
    where: { id: params.actionId },
    select: { id: true, objectCareId: true, createdById: true },
  })
  if (!action || action.objectCareId !== params.objectId) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (action.createdById !== userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const canRead = await userCanReadObjectCare(userId, params.objectId)
  if (!canRead) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await prisma.objectAction.delete({ where: { id: params.actionId } })
  return NextResponse.json({ ok: true })
}

