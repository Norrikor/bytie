'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { TimePresetKey } from '@/lib/filters/timePresets'

type Props = {
  presets: Array<{ id: TimePresetKey; label: string }>
  /**
   * Search param key for selecting the preset.
   * Default: `range`
   */
  paramKey?: string
  /**
   * Base href (without search params) to build links.
   * Default: current pathname.
   */
  baseHref?: string
  activeKey?: TimePresetKey | null
  className?: string
}

export default function TimePresets({
  presets,
  paramKey = 'range',
  baseHref,
  activeKey,
  className,
}: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hrefBase = baseHref ?? pathname

  function hrefForPreset(key: TimePresetKey) {
    const p = new URLSearchParams(searchParams.toString())
    p.set(paramKey, key)
    return `${hrefBase}?${p.toString()}`
  }

  return (
    <div className={className} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {presets.map(({ id, label }) => {
        const active = activeKey === id
        return (
          <Link
            key={id}
            href={hrefForPreset(id)}
            scroll={false}
            className={`quickObjectTab${active ? ' quickObjectTab--active' : ''}`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

