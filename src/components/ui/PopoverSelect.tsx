'use client'

import { useEffect, useId, useRef, useState } from 'react'

export type PopoverSelectOption = { value: string; label: string }

export type PopoverSelectProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: PopoverSelectOption[]
  /** Без подписи над кнопкой — только для компактных рядов (например время в календаре) */
  hideLabel?: boolean
  className?: string
}

export default function PopoverSelect({
  label,
  value,
  onChange,
  options,
  hideLabel,
  className,
}: PopoverSelectProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const active = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const rootClass = [hideLabel ? 'popoverSelectRoot' : 'field', className].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={rootClass} style={{ position: 'relative' }}>
      {hideLabel ? null : (
        <span className="fieldLabel" id={labelId}>
          {label}
        </span>
      )}
      <button
        type="button"
        className="popoverSelectButton"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={hideLabel ? undefined : labelId}
        aria-label={hideLabel ? label : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{active?.label ?? options[0]?.label ?? '—'}</span>
        <span style={{ opacity: 0.6 }} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="popoverSelectMenu" role="listbox" aria-label={label}>
          {options.map((o) => (
            <button
              key={o.value || '__empty'}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`popoverSelectOption${o.value === value ? ' popoverSelectOptionActive' : ''}`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
