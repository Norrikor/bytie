'use client'

import { useEffect, useId, useRef, useState } from 'react'

import PopoverSelect from '@/components/ui/PopoverSelect'
import { formatPickerPreview } from '@/lib/datetime/wallTime'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

type DateTimePickerProps = {
  id: string
  label: string
  /** date — только календарный день (полночь локального дня); datetime — день + время */
  mode: 'date' | 'datetime'
  valueUtcIso: string
  onChangeUtcIso: (iso: string) => void
}

export default function DateTimePicker({
  id,
  label,
  mode,
  valueUtcIso,
  onChangeUtcIso,
}: DateTimePickerProps) {
  const uid = useId()
  const panelId = `${uid}-panel`
  const btnId = `${id}-btn`

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const base = valueUtcIso ? new Date(valueUtcIso) : new Date()
  const validBase = Number.isNaN(base.getTime()) ? new Date() : base

  const [viewYear, setViewYear] = useState(validBase.getFullYear())
  const [viewMonth, setViewMonth] = useState(validBase.getMonth())

  useEffect(() => {
    if (!valueUtcIso) return
    const d = new Date(valueUtcIso)
    if (!Number.isNaN(d.getTime())) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [valueUtcIso])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const startPad = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < startPad; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })

  function applyDay(day: number) {
    const src = valueUtcIso ? new Date(valueUtcIso) : new Date()
    const h = mode === 'datetime' ? src.getHours() : 0
    const m = mode === 'datetime' ? src.getMinutes() : 0
    const next = new Date(viewYear, viewMonth, day, h, m, 0, 0)
    onChangeUtcIso(next.toISOString())
    if (mode === 'date') setOpen(false)
  }

  function setTime(hours: number, minutes: number) {
    const src = valueUtcIso ? new Date(valueUtcIso) : new Date()
    src.setHours(hours, minutes, 0, 0)
    onChangeUtcIso(src.toISOString())
  }

  const sel =
    valueUtcIso && !Number.isNaN(new Date(valueUtcIso).getTime())
      ? new Date(valueUtcIso)
      : null

  const header = firstOfMonth.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
  const headerCap = header.charAt(0).toUpperCase() + header.slice(1)

  function prevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  function nextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const isSelected = (day: number) =>
    sel &&
    day === sel.getDate() &&
    viewMonth === sel.getMonth() &&
    viewYear === sel.getFullYear()

  const preview = formatPickerPreview(valueUtcIso, mode)

  const hourVal = sel ? sel.getHours() : validBase.getHours()
  const minVal = sel ? sel.getMinutes() : validBase.getMinutes()

  const hourOptions = Array.from({ length: 24 }, (_, h) => ({
    value: String(h),
    label: String(h).padStart(2, '0'),
  }))
  const minuteOptions = Array.from({ length: 60 }, (_, m) => ({
    value: String(m),
    label: String(m).padStart(2, '0'),
  }))

  return (
    <div className="field uiDtPicker" ref={rootRef}>
      <span className="fieldLabel" id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        id={btnId}
        className="uiDtPickerTrigger popoverSelectButton"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={valueUtcIso ? '' : 'uiDtPickerPlaceholder'}>{preview}</span>
        <span className="uiDtPickerCalendarIcon" aria-hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </button>

      {open ? (
        <div id={panelId} className="uiDtPickerPanel" role="dialog" aria-modal="true">
          <div className="uiDtPickerHead">
            <button type="button" className="uiDtPickerNav" onClick={prevMonth} aria-label="Предыдущий месяц">
              ‹
            </button>
            <span className="uiDtPickerMonth">{headerCap}</span>
            <button type="button" className="uiDtPickerNav" onClick={nextMonth} aria-label="Следующий месяц">
              ›
            </button>
          </div>

          <div className="uiDtPickerWeekdays">
            {WEEKDAYS.map((w) => (
              <span key={w} className="uiDtPickerWeekday">
                {w}
              </span>
            ))}
          </div>

          <div className="uiDtPickerGrid">
            {cells.map((c, i) =>
              c.day == null ? (
                <span key={`e-${i}`} className="uiDtPickerCell uiDtPickerCellEmpty" />
              ) : (
                <button
                  key={c.day}
                  type="button"
                  className={`uiDtPickerCell${isSelected(c.day) ? ' uiDtPickerCellSelected' : ''}${isToday(c.day) ? ' uiDtPickerCellToday' : ''}`}
                  onClick={() => applyDay(c.day!)}
                >
                  {c.day}
                </button>
              ),
            )}
          </div>

          {mode === 'datetime' ? (
            <div className="uiDtPickerTime">
              <span className="uiDtPickerTimeLabel">Время</span>
              <div className="uiDtPickerTimeRow">
                <PopoverSelect
                  hideLabel
                  label="Час"
                  value={String(hourVal)}
                  options={hourOptions}
                  onChange={(v) => setTime(Number(v), minVal)}
                />
                <span className="uiDtPickerTimeSep">:</span>
                <PopoverSelect
                  hideLabel
                  label="Минута"
                  value={String(minVal)}
                  options={minuteOptions}
                  onChange={(v) => setTime(hourVal, Number(v))}
                />
              </div>
            </div>
          ) : null}

          {mode === 'datetime' ? (
            <button type="button" className="uiDtPickerDone btnGhost" onClick={() => setOpen(false)}>
              Готово
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
