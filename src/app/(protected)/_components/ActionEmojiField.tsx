'use client'

import dynamic from 'next/dynamic'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react'

import { actionEmojiPresets } from '@/lib/emoji/actionEmojiPresets'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="emojiModalLoading">Загрузка панели…</div>,
})

type Props = {
  value: string
  onChange: (icon: string) => void
  label?: string
  disabled?: boolean
  id?: string
}

export default function ActionEmojiField({ value, onChange, label = 'Эмодзи', disabled, id: idProp }: Props) {
  const generatedId = useId()
  const triggerId = idProp ?? `${generatedId}-trigger`
  const titleId = `${generatedId}-modal-title`

  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function applyManual() {
    const t = manual.trim()
    if (!t) return
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      const parts = Array.from(seg.segment(t))
      const first = parts[0]?.segment
      if (first) onChange(first)
    } catch {
      const first = Array.from(t)[0]
      if (first) onChange(first)
    }
    setOpen(false)
  }

  function handleEmojiClick(emoji: EmojiClickData) {
    onChange(emoji.emoji)
    setOpen(false)
  }

  const modal = open ? (
    <div
      className="emojiModalOverlay"
      role="presentation"
      onClick={() => setOpen(false)}
    >
      <div
        className="emojiModalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="emojiModalHeader">
          <h2 id={titleId} className="emojiModalTitle">
            Все эмодзи
          </h2>
          <button type="button" className="emojiModalClose" onClick={() => setOpen(false)} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="emojiModalPickerWrap">
          <EmojiPicker
            emojiStyle={EmojiStyle.NATIVE}
            onEmojiClick={handleEmojiClick}
            theme={Theme.LIGHT}
            searchPlaceHolder="Поиск…"
            width="100%"
            height={380}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
          />
        </div>
        <div className="emojiModalManual">
          <label className="emojiModalManualLabel" htmlFor={`${triggerId}-manual`}>
            Или вставьте с клавиатуры
          </label>
          <div className="emojiModalManualRow">
            <input
              id={`${triggerId}-manual`}
              type="text"
              className="emojiModalManualInput"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Один символ / один эмодзи"
              maxLength={64}
              disabled={disabled}
            />
            <button type="button" className="btnGhost" onClick={applyManual} disabled={disabled}>
              OK
            </button>
          </div>
        </div>
        <div className="emojiModalFooter">
          <button type="button" className="btnPrimary" onClick={() => setOpen(false)}>
            Готово
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="actionEmojiField">
      <label className="fieldLabel" htmlFor={triggerId}>
        {label}
      </label>

      <button
        type="button"
        id={triggerId}
        className="emojiFieldTrigger"
        disabled={disabled}
        onClick={() => {
          setManual(value)
          setOpen(true)
        }}
      >
        <span className="emojiFieldTriggerGlyph" aria-hidden>
          {value.trim() || '·'}
        </span>
        <span className="emojiFieldTriggerHint">Открыть полный набор</span>
      </button>

      <div className="emojiPicker emojiPicker--presets" aria-label="Быстрые эмодзи">
        {actionEmojiPresets.map((e) => (
          <button
            key={e}
            type="button"
            disabled={disabled}
            onClick={() => onChange(e)}
            className={`emojiBtn${e === value ? ' emojiBtn--active' : ''}`}
          >
            {e}
          </button>
        ))}
      </div>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </div>
  )
}
