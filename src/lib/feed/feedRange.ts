/** Пресеты периода ленты: от «сейчас» назад (мс) */
export const FEED_RANGE_MS: Record<string, number> = {
  '10m': 10 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

export const FEED_RANGE_DEFAULT = '24h' as const

export const FEED_RANGE_PRESETS: Array<{ id: string; label: string }> = [
  { id: '10m', label: '10 мин' },
  { id: '30m', label: '30 мин' },
  { id: '1h', label: '1 ч' },
  { id: '3h', label: '3 ч' },
  { id: '24h', label: '24 ч' },
  { id: '3d', label: '3 дня' },
  { id: '7d', label: 'Неделя' },
]
