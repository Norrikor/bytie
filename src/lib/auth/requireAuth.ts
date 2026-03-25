import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth/authOptions'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return session
}

