'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const emojiPresets = [
  // === ОРИГИНАЛЬНЫЕ (12) ===
  '💧', '🍽️', '😺', '🩺', '🔥', '🌿', '🐾', '✨', '☀️', '🫀', '🌱',

  // === КОММУНИКАЦИЯ (7) ===
  '📞', '💬', '📧', '📲', '🔔', '🗣️', '👥',

  // === ЭМОЦИИ И ОТНОШЕНИЯ (9) ===
  '❤️', '💋', '🤗', '😊', '🥰', '😢', '🤝', '🙏', '💪',

  // === ДВИЖЕНИЕ И ЛОКАЦИИ (6) ===
  '🚗', '✈️', '🏃', '🚶', '🏠', '🚪',

  // === ДЕНЬГИ И ПОКУПКИ (7) — расширено ===
  '💰', '🛒', '📦', '💳', '🛍️', '🧾', '🏦',

  // === ЕДА И ЗДОРОВЬЕ (9) — добавлены физиология ===
  '☕', '🥗', '💊', '🏥', '🧘', '🚿', '🛌', '💤', '💩', '🚽', '🧻', '🩸',

  // === РАБОТА И ЗАДАЧИ (8) ===
  '💼', '📝', '✅', '🧹', '🔧', '🗑️', '📊', '👔',

  // === РАЗВЛЕЧЕНИЯ И ХОББИ (10) ===
  '🎬', '📖', '🎧', '🎨', '⚽', '🎂', '🎁', '🎼', '🖌️', '🎮',

  // === ПРИРОДА И ПОГОДА (5) ===
  '🐶', '🌸', '🌧️', '🌡️', '🌪️',

  // === НОВОЕ: ФИЗИОЛОГИЯ И ПРИВЫЧКИ (6) ===
  '💨', '🚬', '🍷', '🍺', '🥃', '🍾',

  // === НОВОЕ: СПОРТ И АКТИВНОСТЬ (5) ===
  '🏋️', '🤸', '🚴', '🏊', '🧖‍♀️',

  // === НОВОЕ: УЧЕБА И ТВОРЧЕСТВО (4) ===
  '📚', '🎓', '✍️', '🧠',

  // === НОВОЕ: ДОМ И БЫТ (5) ===
  '🧺', '🧼', '🧴', '🪴', '🛋️',

  // === НОВОЕ: ТРАНСПОРТ И ПРОЧЕЕ (3) ===
  '⛽', '🅿️', '👶', '💍'
];

export default function OnboardingCreateFirstAction({ objectCareId }: { objectCareId: string }) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('✨')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => label.trim().length >= 2 && icon.trim().length > 0 && !submitting, [
    label,
    icon,
    submitting,
  ])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/objects/${objectCareId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, icon }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error ?? 'Что-то пошло не так')
        return
      }

      router.push(`/onboarding/4?objectCareId=${objectCareId}`)
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <label className="fieldLabel" htmlFor="actionLabel">Название действия</label>
        <input
          id="actionLabel"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Покормил, Попил воды, Прогулка…"
          autoFocus
        />
      </div>

      <div className="field">
        <span className="fieldLabel">Эмодзи</span>
        <div className="emojiPicker">
          {emojiPresets.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              className={`emojiBtn${e === icon ? ' emojiBtn--active' : ''}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="errorText">{error}</div> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btnPrimary"
      >
        {submitting ? 'Добавляем…' : 'Дальше →'}
      </button>
    </form>
  )
}
