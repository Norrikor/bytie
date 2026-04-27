import { getDisplayTimeZone } from '@/lib/datetime/wallTime'

const occurredAtLocaleOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
}

/** SSR / сервер: TZ из NEXT_PUBLIC_APP_TIMEZONE или TZ процесса Node (на проде часто UTC).
 * Для отображения пользователю в его зоне см. {@link formatEventOccurredAtLocalLabel} и `@/components/app/EventMetaTime`. */
export function formatEventOccurredAtLabel(occurredAt: Date): string {
  const tz = getDisplayTimeZone()
  return occurredAt.toLocaleString('ru-RU', {
    ...(tz ? { timeZone: tz } : {}),
    ...occurredAtLocaleOptions,
  })
}

/** Локальное время среды выполнения (на клиенте — часовой пояс браузера). */
export function formatEventOccurredAtLocalLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ru-RU', occurredAtLocaleOptions)
}
