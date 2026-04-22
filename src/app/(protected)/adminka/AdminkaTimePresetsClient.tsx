'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import TimePresets from '@/components/ui/TimePresets'
import type { TimePresetKey } from '@/lib/filters/timePresets'

export default function AdminkaTimePresetsClient({
  rangePresets,
}: {
  rangePresets: Array<{ id: TimePresetKey; label: string }>
}) {
  const searchParams = useSearchParams()
  const rangeRaw = searchParams.get('range') as TimePresetKey | null

  // Sanity check: if query has unknown preset - just don't mark anything active.
  const activeKey = useMemo(() => {
    if (!rangeRaw) return null
    return rangePresets.some((p) => p.id === rangeRaw) ? rangeRaw : null
  }, [rangeRaw, rangePresets])

  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Период</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <TimePresets presets={rangePresets} paramKey="range" activeKey={activeKey} />
      </div>
    </div>
  )
}

