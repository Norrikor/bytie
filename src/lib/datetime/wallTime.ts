/**
 * Перевод между UTC ISO (хранение в URL / БД) и значением datetime-local (локальная стена времени браузера).
 * datetime-local не содержит TZ — интерпретация только в локали пользователя.
 */

/** Строка из <input type="datetime-local"> → UTC ISO для query */
export function datetimeLocalToUtcIso(localValue: string): string {
  if (!localValue?.trim()) return ''
  const normalized = localValue.length === 16 ? `${localValue}:00` : localValue
  const [datePart, timePart] = normalized.split('T')
  if (!datePart || !timePart) return ''
  const [y, mo, d] = datePart.split('-').map(Number)
  const [hh, mm, ...rest] = timePart.split(':')
  const sec = rest[0] != null ? Number(rest[0]) : 0
  const ms = typeof rest[1] === 'string' ? Number(rest[1].replace(/\D/g, '') || 0) : 0
  const dt = new Date(y, mo - 1, d, Number(hh), Number(mm), sec, ms)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toISOString()
}

/** UTC ISO → значение для <input type="datetime-local"> (локальный календарь браузера) */
export function utcIsoToDatetimeLocal(iso: string): string {
  if (!iso?.trim()) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

/** Явный ISO с Z или со смещением — для парсинга на сервере */
export function parseUtcIsoFromUrl(s: string | undefined): Date | undefined {
  if (!s?.trim()) return undefined
  const d = new Date(decodeURIComponent(s))
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** Короткий превью-текст для кнопки пикера (локаль браузера) */
export function formatPickerPreview(iso: string | undefined, mode: 'date' | 'datetime'): string {
  if (!iso?.trim()) return 'Выбрать…'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Выбрать…'
  if (mode === 'date') {
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Лейблы карточек событий: одна TZ для SSR и клиента (прод часто UTC без env) */
export function getDisplayTimeZone(): string | undefined {
  const tz = process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim()
  return tz || undefined
}

/** Фиксированный оффсет для legacy-фильтра по одной дате (минуты к востоку от UTC), напр. 180 для UTC+3 */
export function getLegacyTzOffsetMinutes(): number | null {
  const raw = process.env.NEXT_PUBLIC_TZ_OFFSET_MINUTES?.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Начало календарного дня в зоне с оффсетом; offset null → как раньше (полночь UTC этой даты). */
export function legacyYmdStartUtc(
  ymd: string,
  offsetMinutesEast: number | null,
): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined
  const [y, mo, d] = ymd.split('-').map(Number)
  if (offsetMinutesEast == null) {
    return new Date(`${ymd}T00:00:00.000Z`)
  }
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - offsetMinutesEast * 60 * 1000)
}

function nextCalendarYmd(ymd: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined
  const [y, mo, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function legacyYmdEndUtc(
  ymd: string,
  offsetMinutesEast: number | null,
): Date | undefined {
  const nx = nextCalendarYmd(ymd)
  if (!nx) return undefined
  const startNext = legacyYmdStartUtc(nx, offsetMinutesEast)
  return startNext ? new Date(startNext.getTime() - 1) : undefined
}
