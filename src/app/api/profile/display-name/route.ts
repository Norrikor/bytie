import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

const DisplayNameSchema = z.object({
  name: z.string().min(2).max(40).trim(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = DisplayNameSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const userId = (session.user as any).id as string | undefined
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  })

  return NextResponse.json({ ok: true })
}

