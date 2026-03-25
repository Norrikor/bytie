import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = (session.user as any).id as string | undefined
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  })

  if (!user) return null
  return { session, user }
}

