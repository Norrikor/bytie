import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

const CreateObjectSchema = z.object({
  // Allow "Я" (single char) and similar names.
  name: z.string().min(1).max(40).trim(),
  kind: z.string().max(40).trim().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const memberships = await prisma.objectCareMember.findMany({
    where: { userId, endedAt: null },
    include: { objectCare: true },
    orderBy: { joinedAt: 'desc' },
  })

  const objects = memberships.map((m) => ({
    id: m.objectCare.id,
    name: m.objectCare.name,
    kind: m.objectCare.kind,
    createdAt: m.objectCare.createdAt,
  }))

  return NextResponse.json({ objects })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = CreateObjectSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

  const { name, kind } = parsed.data

  const created = await prisma.objectCare.create({
    data: {
      ownerId: userId,
      name,
      kind: kind ?? null,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    select: { id: true, name: true, kind: true, createdAt: true },
  })

  return NextResponse.json({ object: created })
}

