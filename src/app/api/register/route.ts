import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/db/prisma'

const RegisterSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = RegisterSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 })

  const passwordHash = await hash(password, 10)

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  })

  return NextResponse.json({ ok: true })
}

