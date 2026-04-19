import type { ReactNode } from 'react'
import Link from 'next/link'

export type ActionEventCardProps = {
  occurredAt: string
  occurredAtLabel: string
  iconSnapshot: string
  labelSnapshot: string
  /** Название объекта для пилюли; на странице объекта обычно не передаём */
  objectCareName?: string | null
  /** Показывать пилюлю объекта (на странице объекта — false) */
  showObjectPill?: boolean
  showActor: boolean
  actorId: string
  actorName: string | null
  /** Кнопки редактирования / удаления справа */
  trailing?: ReactNode
}

export default function ActionEventCard({
  occurredAt,
  occurredAtLabel,
  iconSnapshot,
  labelSnapshot,
  objectCareName,
  showObjectPill = true,
  showActor,
  actorId,
  actorName,
  trailing,
}: ActionEventCardProps) {
  const pill = showObjectPill && !!objectCareName

  return (
    <div className={trailing ? 'eventCard eventCard--withTrailing' : 'eventCard'}>
      <div className="eventIconWrap" aria-hidden>
        <span className="eventIcon">{iconSnapshot}</span>
      </div>
      <div className="eventBody">
        <div className="eventTitleRow">
          <span className="eventAction">{labelSnapshot}</span>
          {pill ? (
            <>
              <span className="eventTitleSep">·</span>
              <span className="eventObjectPill">{objectCareName}</span>
            </>
          ) : null}
        </div>
        <div className="eventMetaRow">
          <time className="eventMetaTime" dateTime={occurredAt}>
            {occurredAtLabel}
          </time>
          {showActor ? (
            <>
              <span className="eventMetaSep" aria-hidden>
                ·
              </span>
              <Link href={`/people/${actorId}`} className="eventActorLink">
                {actorName ?? '…'}
              </Link>
            </>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="eventCardTrailing">{trailing}</div> : null}
    </div>
  )
}
