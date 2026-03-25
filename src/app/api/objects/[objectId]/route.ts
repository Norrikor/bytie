import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { assertIsOwner, userCanReadObjectCare } from '@/lib/acl/objectCare'

const UpdateObjectSchema = z.object({
  name: z.string().min(2).max(40).trim().optional(),
  kind: z.string().max(40).trim().nullable().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const ok = await userCanReadObjectCare(userId, params.objectId)
  if (!ok) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const obj = await prisma.objectCare.findUnique({
    where: { id: params.objectId },
    select: { id: true, name: true, kind: true, createdAt: true, updatedAt: true, ownerId: true },
  })

  if (!obj) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({
    object: { id: obj.id, name: obj.name, kind: obj.kind, createdAt: obj.createdAt, updatedAt: obj.updatedAt },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const isOwner = await assertIsOwner(userId, params.objectId)
  if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = UpdateObjectSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { name, kind } = parsed.data

  const updated = await prisma.objectCare.update({
    where: { id: params.objectId },
    data: {
      name: name ?? undefined,
      kind: kind === undefined ? undefined : kind,
    },
    select: { id: true, name: true, kind: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json({ object: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const isOwner = await assertIsOwner(userId, params.objectId)
  if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await prisma.objectCare.delete({ where: { id: params.objectId } })
  return NextResponse.json({ ok: true })
}

