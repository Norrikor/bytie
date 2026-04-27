import BottomNavClient from './BottomNavClient'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export default async function BottomNav() {
  const current = await getCurrentUser()
  const isAdmin = current?.user?.role === 'ADMIN'
  return <BottomNavClient isAdmin={!!isAdmin} />
}
