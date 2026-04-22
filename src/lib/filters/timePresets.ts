import { FEED_RANGE_MS, FEED_RANGE_PRESETS } from '@/lib/feed/feedRange'

export const ADMINKA_TIME_PRESETS = [
  { id: '1h', label: '1 ч' },
  { id: '24h', label: '1 день' },
  { id: '7d', label: '1 неделя' },
  { id: '30d', label: '1 месяц' },
  { id: '6m', label: 'пол года' },
  { id: '1y', label: '1 год' },
] as const

export type TimePresetKey = keyof typeof ALL_RANGE_MS

export const FEED_TIME_PRESETS = FEED_RANGE_PRESETS as Array<{ id: TimePresetKey; label: string }>

export const ALL_RANGE_MS = {
  ...FEED_RANGE_MS,
  // Admninka periods (на данном этапе используем фиксированные длительности).
  // 1d=24h, 1w=7d, 1m=30d, 0.5y=6m, 1y=365d.
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '6m': 6 * 30 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
} as const

export function getRangeForPreset(key: TimePresetKey, now: Date = new Date()) {
  const ms = ALL_RANGE_MS[key]
  const start = new Date(now.getTime() - ms)
  const end = now
  return { start, end }
}

