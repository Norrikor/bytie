import { getDisplayTimeZone } from '@/lib/datetime/wallTime'

/** Единый формат даты/времени для карточек событий (лента, объект, …).
 * NEXT_PUBLIC_APP_TIMEZONE (IANA), напр. Europe/Moscow — чтобы SSR и клиент совпадали с вашим GMT. */
export function formatEventOccurredAtLabel(occurredAt: Date): string {
  const tz = getDisplayTimeZone()
  return occurredAt.toLocaleString('ru-RU', {
    ...(tz ? { timeZone: tz } : {}),
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
