'use client'

import { useLayoutEffect, useState } from 'react'

import { formatEventOccurredAtLocalLabel } from '@/lib/feed/eventDateLabel'

type EventMetaTimeProps = {
  occurredAt: string
  /** Подпись с сервера — совпадает с SSR и закрывает первый кадр до локального форматирования */
  serverLabel: string
}

/** Единый `<time>` для событий: тот же класс и формат, время в TZ пользователя после гидрации */
export default function EventMetaTime({ occurredAt, serverLabel }: EventMetaTimeProps) {
  const [label, setLabel] = useState(serverLabel)

  useLayoutEffect(() => {
    setLabel(formatEventOccurredAtLocalLabel(occurredAt))
  }, [occurredAt])

  return (
    <time className="eventMetaTime" dateTime={occurredAt}>
      {label}
    </time>
  )
}
