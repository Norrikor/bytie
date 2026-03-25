import { redirect } from 'next/navigation'

import OnboardingNameForm from './OnboardingNameForm'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOnboardingProgress } from '@/lib/onboarding/getOnboardingProgress'

export default async function OnboardingStep1() {
  const current = await getCurrentUser()
  if (current?.user?.id) {
    const progress = await getOnboardingProgress(current.user.id)
    if (progress.done) redirect('/feed')
    if (progress.nextPath !== '/onboarding/1') redirect(progress.nextPath)
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <h1 className="authTitle">Как вас звать?</h1>
          <p className="authSubtitle">
            Это имя увидят близкие в общей ленте. Можно имя, прозвище — как вам приятно.
          </p>
        </div>
        <OnboardingNameForm />
      </div>
    </div>
  )
}
