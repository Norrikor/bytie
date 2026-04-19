import { redirect } from 'next/navigation'
import Link from 'next/link'

import { prisma } from '@/lib/db/prisma'
import ObjectsCreateForm from './ObjectsCreateForm'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export default async function ObjectsPage() {
  const current = await getCurrentUser()
  if (!current?.user?.name) redirect('/onboarding/1')

  const userId = current?.user.id
  if (!userId) redirect('/login')

  const memberships = await prisma.objectCareMember.findMany({
    where: { userId, endedAt: null },
    include: { objectCare: true },
    orderBy: { joinedAt: 'desc' },
  })

  const objects = memberships.map((m) => m.objectCare)

  return (
    <div className="pageSection">
      <div className="pageHeader">
        <h1>Подопечные</h1>
        <p className="pageLead">Всё, о чём вы печётесь — здесь. Нажмите, чтобы отметить действие.</p>
      </div>

      <div className="card">
        <div className="filtersPanelLabel" style={{ marginBottom: 12 }}>Новое</div>
        <ObjectsCreateForm />
      </div>

      {objects.length === 0 ? (
        <div className="emptyState">
          <span className="emptyStateIcon">🏡</span>
          <p className="emptyStateText">
            Пока здесь пусто.<br />
            Добавьте первого подопечного.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objects.map((obj) => (
            <Link key={obj.id} href={`/objects/${obj.id}`} className="objectCard">
              <div>
                <div className="objectCardName">{obj.name}</div>
                {obj.kind ? <div className="objectCardKind">{obj.kind}</div> : null}
              </div>
              <span className="objectCardArrow">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
