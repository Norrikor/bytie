import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

const CreateActionSchema = z.object({
  label: z.string().min(2).max(40).trim(),
  icon: z.string().min(1).max(64).trim(), // emoji sequence or short string
  color: z.string().max(32).trim().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Anyone with active membership/ownership can read actions.
  const member = await prisma.objectCareMember.findFirst({
    where: { objectCareId: params.objectId, userId, endedAt: null },
    select: { role: true },
  })
  const obj = await prisma.objectCare.findUnique({
    where: { id: params.objectId },
    select: { ownerId: true },
  })

  const canRead = member !== null || obj?.ownerId === userId
  if (!canRead) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const actions = await prisma.objectAction.findMany({
    where: { objectCareId: params.objectId },
    orderBy: { sortIndex: 'asc' },
    select: { id: true, label: true, icon: true, color: true, createdById: true, createdAt: true },
  })

  return NextResponse.json({ actions })
}

export async function POST(
  req: Request,
  { params }: { params: { objectId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const member = await prisma.objectCareMember.findFirst({
    where: { objectCareId: params.objectId, userId, endedAt: null },
    select: { role: true },
  })
  const obj = await prisma.objectCare.findUnique({
    where: { id: params.objectId },
    select: { ownerId: true },
  })

  const canAdd = member !== null || obj?.ownerId === userId
  if (!canAdd) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = CreateActionSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { label, icon, color } = parsed.data

  const action = await prisma.objectAction.create({
    data: {
      objectCareId: params.objectId,
      createdById: userId,
      label,
      icon,
      color: color ?? null,
    },
    select: { id: true, label: true, icon: true, color: true, createdById: true },
  })

  return NextResponse.json({ action })
}

