'use client'

import type { ReactNode } from 'react'

export type StatCard = {
  title: string
  value: ReactNode
}

function StatCard({ title, value }: StatCard) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  )
}

export default function StatCardGrid({
  items,
  dense,
}: {
  items: StatCard[]
  /**
   * Dense mode for many counters (smaller height/padding).
   */
  dense?: boolean
}) {
  const padding = dense ? '12px 14px' : '14px 16px'
  const fontSize = dense ? 22 : 28
  const gap = dense ? 10 : 12

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`,
        gap,
      }}
    >
      {items.map((it) => (
        <div key={it.title} style={{}}>
          <div
            className="card"
            style={{
              padding,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.title}</div>
            <div style={{ fontSize, fontWeight: 700, marginTop: 8 }}>{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

