import { prisma } from '@/lib/db/prisma'

type ProgressResult =
  | { done: true }
  | { done: false; nextPath: '/onboarding/1' | '/onboarding/2' | '/onboarding/3'; objectCareId?: string }

export async function getOnboardingProgress(userId: string): Promise<ProgressResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  if (!user?.name) return { done: false, nextPath: '/onboarding/1' }

  const memberships = await prisma.objectCareMember.findMany({
    where: { userId, endedAt: null },
    orderBy: { joinedAt: 'desc' },
    select: { objectCareId: true },
  })
  if (memberships.length === 0) return { done: false, nextPath: '/onboarding/2' }

  const objectCareIds = memberships.map((m) => m.objectCareId)
  const primaryObjectCareId = objectCareIds[0]

  const actionsCount = await prisma.objectAction.count({
    where: { objectCareId: { in: objectCareIds } },
  })
  if (actionsCount === 0) {
    return { done: false, nextPath: '/onboarding/3', objectCareId: primaryObjectCareId }
  }

  return { done: true }
}
