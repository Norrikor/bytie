'use client'

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

function usePrefersFineHover(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setV(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return v
}

export type TooltipProps = {
  /** Короткий заголовок подсказки и подпись для кнопки (aria-label) */
  title: string
  children: ReactNode
  /**
   * `panel` — широкий блок подсказки на всю ширину контейнера.
   * `default` — компактный блок, по центру под иконкой.
   */
  variant?: 'default' | 'panel'
  /** Слева от иконки в одной строке (например подпись «Период»), только при `variant="panel"` */
  leading?: ReactNode
}

/**
 * Десктоп с hover: подсказка только при наведении на **иконку** (или на открытый текст, чтобы прочитать).
 * Тач: открытие по нажатию на иконку, закрытие — снаружи или Escape.
 */
export default function Tooltip({
  title,
  children,
  variant = 'default',
  leading,
}: TooltipProps) {
  const uid = useId()
  const titleHeadingId = `${uid}-tooltip-title`
  const tipId = `${uid}-tooltip-panel`
  const rootRef = useRef<HTMLDivElement>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersHover = usePrefersFineHover()

  const [hoverTrigger, setHoverTrigger] = useState(false)
  const [hoverBubble, setHoverBubble] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  const [pinned, setPinned] = useState(false)

  function clearLeaveTimer() {
    if (leaveTimerRef.current != null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }

  useEffect(() => () => clearLeaveTimer(), [])

  const hoverShow = hoverTrigger || hoverBubble
  const open = prefersHover ? hoverShow || focusInside : pinned

  const closeTouch = useCallback(() => setPinned(false), [])

  useEffect(() => {
    if (!open) return
    function esc(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      closeTouch()
      clearLeaveTimer()
      setHoverTrigger(false)
      setHoverBubble(false)
      setFocusInside(false)
      ;(document.activeElement as HTMLElement | undefined)?.blur()
    }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open, closeTouch])

  useEffect(() => {
    if (prefersHover || !pinned) return
    function handleDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeTouch()
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [prefersHover, pinned, closeTouch])

  function handleTriggerClick(e: React.MouseEvent) {
    if (prefersHover) return
    e.preventDefault()
    setPinned((p) => !p)
  }

  function onTriggerMouseEnter() {
    if (!prefersHover) return
    clearLeaveTimer()
    setHoverTrigger(true)
  }

  function onTriggerMouseLeave() {
    if (!prefersHover) return
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(() => setHoverTrigger(false), 120)
  }

  function onBubbleMouseEnter() {
    if (!prefersHover) return
    clearLeaveTimer()
    setHoverBubble(true)
  }

  function onBubbleMouseLeave() {
    if (!prefersHover) return
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(() => setHoverBubble(false), 120)
  }

  const triggerBtn = (
    <button
      type="button"
      className={
        variant === 'panel' ? 'tooltipTrigger tooltipTrigger--inPanelHead' : 'tooltipTrigger'
      }
      aria-label={title}
      aria-expanded={open}
      aria-controls={tipId}
      id={`${uid}-trigger`}
      onClick={handleTriggerClick}
      onMouseEnter={onTriggerMouseEnter}
      onMouseLeave={onTriggerMouseLeave}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null
        if (!rootRef.current?.contains(next)) setFocusInside(false)
      }}
    >
      <span aria-hidden className="tooltipTriggerIcon">
        <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="8" r="1.1" fill="currentColor" />
          <path
            d="M12 11v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  )

  return (
    <div
      ref={rootRef}
      className={variant === 'panel' ? 'tooltipRoot tooltipRoot--panel' : 'tooltipRoot'}
    >
      {variant === 'panel' ? (
        <div
          className={
            leading
              ? 'tooltipPanelHeadRow'
              : 'tooltipPanelHeadRow tooltipPanelHeadRow--onlyTrigger'
          }
        >
          {leading ? <div className="tooltipPanelHeadLeading">{leading}</div> : null}
          {triggerBtn}
        </div>
      ) : (
        triggerBtn
      )}

      {open ? (
        <div
          id={tipId}
          role="region"
          className={
            variant === 'panel' ? 'tooltipBubble tooltipBubble--panel' : 'tooltipBubble'
          }
          aria-labelledby={titleHeadingId}
          onMouseEnter={onBubbleMouseEnter}
          onMouseLeave={onBubbleMouseLeave}
        >
          <p id={titleHeadingId} className="tooltipBubbleTitle">
            {title}
          </p>
          <div className="tooltipBubbleBody">{children}</div>
        </div>
      ) : null}
    </div>
  )
}
