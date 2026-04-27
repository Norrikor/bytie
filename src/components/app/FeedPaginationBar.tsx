'use client'

import { useEffect, useState } from 'react'

type Props = {
  currentPage: number
  totalPages: number
  totalCount: number
  disabled?: boolean
  onNavigate: (page: number) => void
}

export default function FeedPaginationBar({
  currentPage,
  totalPages,
  totalCount,
  disabled,
  onNavigate,
}: Props) {
  const [showPagePopover, setShowPagePopover] = useState(false)
  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => setPageInput(String(currentPage)), [currentPage])

  function submitPage() {
    const n = Number.parseInt(pageInput, 10)
    if (Number.isNaN(n)) return
    const safe = Math.min(Math.max(n, 1), totalPages)
    onNavigate(safe)
    setShowPagePopover(false)
  }

  return (
    <div className="feedPaginationBlock">
      <div
        className="cardSoft"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          position: 'relative',
        }}
      >
        <button
          type="button"
          className="btnGhost"
          style={{ width: 'auto', padding: '10px 14px' }}
          onClick={() => onNavigate(currentPage - 1)}
          disabled={currentPage <= 1 || disabled}
        >
          ← Назад
        </button>

        <button
          type="button"
          className="btnIcon"
          style={{ padding: '10px 14px' }}
          onClick={() => {
            setPageInput(String(currentPage))
            setShowPagePopover((v) => !v)
          }}
          disabled={totalPages <= 1 || disabled}
        >
          {currentPage} из {totalPages}
        </button>
        {showPagePopover ? (
          <div className="popoverPagePicker">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="pagePickerInput"
              />
              <button type="button" className="btnIcon btnIcon--accent" onClick={submitPage}>
                Перейти
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="btnGhost"
          style={{ width: 'auto', padding: '10px 14px' }}
          onClick={() => onNavigate(currentPage + 1)}
          disabled={currentPage >= totalPages || disabled}
        >
          Вперёд →
        </button>
      </div>
      <p className="feedPaginationCount">Всего записей: {totalCount}</p>
    </div>
  )
}
