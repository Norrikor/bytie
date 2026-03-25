import { redirect } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import OnboardingTapAction from './OnboardingTapAction'
import { getOnboardingProgress } from '@/lib/onboarding/getOnboardingProgress'

export default async function OnboardingStep4({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const current = await getCurrentUser()
  if (!current?.user?.id) redirect('/login')

  const progress = await getOnboardingProgress(current.user.id)
  if (progress.done) redirect('/feed')
  if (progress.nextPath !== '/onboarding/4') redirect(progress.nextPath)

  const queryObjectIdRaw = searchParams?.objectCareId
  const queryObjectId = Array.isArray(queryObjectIdRaw) ? queryObjectIdRaw[0] : queryObjectIdRaw
  const objectCareId = queryObjectId || progress.objectCareId
  if (!objectCareId) redirect('/onboarding/2')

  const actions = await prisma.objectAction.findMany({
    where: { objectCareId },
    orderBy: { sortIndex: 'asc' },
    select: { id: true, label: true, icon: true },
    take: 12,
  })

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <h1 className="authTitle">Первый знак</h1>
          <p className="authSubtitle">
            Нажмите на эмодзи — и забота будет отмечена. Так это и работает, просто и тепло.
          </p>
        </div>
        <OnboardingTapAction objectCareId={objectCareId} actions={actions} />
      </div>
    </div>
  )
}
