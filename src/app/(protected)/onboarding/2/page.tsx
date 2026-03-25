import { redirect } from 'next/navigation'

import OnboardingObjectForm from './OnboardingObjectForm'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOnboardingProgress } from '@/lib/onboarding/getOnboardingProgress'

export default async function OnboardingStep2() {
  const current = await getCurrentUser()
  if (!current?.user?.id) redirect('/login')

  const userId = current.user.id
  const progress = await getOnboardingProgress(userId)
  if (progress.done) redirect('/feed')
  if (progress.nextPath !== '/onboarding/2') redirect(progress.nextPath)

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <h1 className="authTitle">О ком заботимся?</h1>
          <p className="authSubtitle">
            Назовите то, за чем хотите следить. О себе любимом, о коте, о цветке на подоконнике — всё подходит.
          </p>
        </div>
        <OnboardingObjectForm />
      </div>
    </div>
  )
}
