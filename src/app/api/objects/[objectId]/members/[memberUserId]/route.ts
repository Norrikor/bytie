import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { assertIsOwner } from '@/lib/acl/objectCare'

export async function DELETE(
  _req: Request,
  { params }: { params: { objectId: string; memberUserId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  if (params.memberUserId === userId) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const isOwner = await assertIsOwner(userId, params.objectId)
  if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const membership = await prisma.objectCareMember.findUnique({
    where: { objectCareId_userId: { objectCareId: params.objectId, userId: params.memberUserId } },
    select: { endedAt: true },
  })
  if (!membership || membership.endedAt) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  await prisma.objectCareMember.update({
    where: { objectCareId_userId: { objectCareId: params.objectId, userId: params.memberUserId } },
    data: { endedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}

