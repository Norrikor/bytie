import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/requireAuth'

export async function requireAdmin() {
  const session = await requireAuth()

  const userId = (session.user as any)?.id as string | undefined
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user || user.role !== 'ADMIN') redirect('/403')
  return { session, user }
}

