import { requireAdmin } from '@/lib/auth/requireAdmin'
import { prisma } from '@/lib/db/prisma'
import { ADMINKA_TIME_PRESETS, type TimePresetKey, getRangeForPreset } from '@/lib/filters/timePresets'

import AdminkaTimePresetsClient from './AdminkaTimePresetsClient'
import StatCardGrid from '@/components/ui/StatCardGrid'

const DEFAULT_RANGE_KEY: TimePresetKey = '24h'

function getFirst(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

export default async function AdminkaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { user } = await requireAdmin()

  const rangeRaw = (getFirst(searchParams.range) as TimePresetKey | undefined) ?? DEFAULT_RANGE_KEY
  const { start, end } = getRangeForPreset(rangeRaw)

  const [totalUsers, objectsCreatedCount, topOwners] = await Promise.all([
    prisma.user.count(),
    prisma.objectCare.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.objectCare.groupBy({
      by: ['ownerId'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
      orderBy: { _count: { ownerId: 'desc' } },
      take: 10,
    }),
  ])

  const topOwnersWithUsers = await Promise.all(
    topOwners.map((row) =>
      prisma.user.findUnique({
        where: { id: row.ownerId },
        select: { id: true, name: true, email: true },
      }),
    ),
  )

  return (
    <div className="pageSection">
      <h1>Админка</h1>
      <p style={{ opacity: 0.75, marginTop: -8 }}>
        Включено как админ: <span style={{ fontWeight: 600 }}>{user.email ?? user.id}</span>
      </p>

      <AdminkaTimePresetsClient rangePresets={ADMINKA_TIME_PRESETS} />

      <StatCardGrid
        dense
        items={[
          { title: 'Всего пользователей', value: totalUsers },
          { title: 'Созданные объекты за период', value: objectsCreatedCount },
        ]}
      />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Топ создателей (до 10)</h2>
        </div>

        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
          Период: <span style={{ fontWeight: 600 }}>{ADMINKA_TIME_PRESETS.find((p) => p.id === rangeRaw)?.label ?? '—'}</span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topOwnersWithUsers
            .map((u, idx) => ({ user: u, count: topOwners[idx]?._count?._all ?? 0 }))
            .filter((x) => x.user)
            .map(({ user, count }) => (
              <div
                key={user!.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 650 }}>{user!.name ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{user!.email ?? user!.id}</span>
                </div>
                <div style={{ fontWeight: 800 }}>{count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

