/** Единый формат даты/времени для карточек событий (лента, объект, …) */
export function formatEventOccurredAtLabel(occurredAt: Date): string {
  return occurredAt.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
