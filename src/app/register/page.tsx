'use client'

import { FormEvent, useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => email.trim().includes('@') && password.length >= 8 && !submitting,
    [email, password, submitting],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as any
        setError(json?.error === 'EMAIL_EXISTS' ? 'Этот адрес уже используется' : 'Не получилось зарегистрироваться')
        return
      }

      const signInRes = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl: '/feed',
      })

      if (!signInRes?.ok) {
        setError('Ошибка входа после регистрации')
        return
      }

      router.push(signInRes.url ?? '/feed')
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
          <h1 className="authTitle">Быт(ь)</h1>
          <p className="authSubtitle">
            Место, где забота о близких, себе и всём вокруг становится чуть легче.
            Пара шагов — и вы дома.
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
              placeholder="не менее восьми знаков"
              autoComplete="new-password"
            />
          </div>

          {error ? <div className="errorText">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btnPrimary"
          >
            {submitting ? 'Создаём…' : 'Начать'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="btnGhost"
          >
            Уже бывали тут? Войти
          </button>
        </form>
      </div>
    </main>
  )
}
