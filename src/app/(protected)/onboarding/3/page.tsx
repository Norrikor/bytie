import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import OnboardingCreateFirstAction from './OnboardingCreateFirstAction'
import { getOnboardingProgress } from '@/lib/onboarding/getOnboardingProgress'

export default async function OnboardingStep3({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const current = await getCurrentUser()
  if (!current?.user?.id) redirect('/login')

  const progress = await getOnboardingProgress(current.user.id)
  if (progress.done) redirect('/feed')
  if (progress.nextPath !== '/onboarding/3') redirect(progress.nextPath)

  const queryObjectIdRaw = searchParams?.objectCareId
  const queryObjectId = Array.isArray(queryObjectIdRaw) ? queryObjectIdRaw[0] : queryObjectIdRaw

  let objectCareId = progress.objectCareId
  if (queryObjectId) {
    const member = await prisma.objectCareMember.findFirst({
      where: { objectCareId: queryObjectId, userId: current.user.id, endedAt: null },
      select: { objectCareId: true },
    })
    if (member) objectCareId = member.objectCareId
  }

  if (!objectCareId) redirect('/onboarding/2')

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <h1 className="authTitle">Что будем делать?</h1>
          <p className="authSubtitle">
            Придумайте действие и выберите эмодзи — потом нажмёте его, и оно запишется в историю.
          </p>
        </div>
        <OnboardingCreateFirstAction objectCareId={objectCareId} />
      </div>
    </div>
  )
}
