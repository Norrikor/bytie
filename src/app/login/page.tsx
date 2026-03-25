'use client'

import { FormEvent, useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim() && password.length >= 1 && !submitting, [email, password, submitting])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl: '/feed',
      })

      if (!res?.ok) {
        setError('Неверный почтовый адрес или пароль')
        return
      }

      router.push(res.url ?? '/feed')
    } catch {
      setError('Не удалось подключиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <h1 className="authTitle">С возвращением</h1>
          <p className="authSubtitle">
            Ваш быт ждёт. Войдите, чтобы продолжить.
          </p>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="fieldLabel" htmlFor="email">Почта</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="вы@пример.ру"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="field">
            <label className="fieldLabel" htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="errorText">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btnPrimary"
          >
            {submitting ? 'Входим…' : 'Войти'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className="btnGhost"
          >
            Впервые здесь? Завести страничку
          </button>
        </form>
      </div>
    </main>
  )
}
