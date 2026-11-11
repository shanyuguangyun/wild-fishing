import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FishArt } from '../assets/illustrations'
import { ChevronLeftIcon } from '../components/Icons'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'

/** 登录 / 注册。两个表单共用一页，减少一次跳转。 */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const { login, register } = useAuth()

  const redirect = params.get('redirect') || '/'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), nickname.trim(), password)
      toast(mode === 'login' ? '欢迎回来' : '注册成功', 'success')
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex items-center px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-soft"
          aria-label="返回"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-8">
        <div className="mt-2 flex flex-col items-center">
          <FishArt className="h-28 w-28" />
          <h1 className="mt-2 text-xl font-black text-ink">
            {mode === 'login' ? '欢迎回来' : '加入野钓客'}
          </h1>
          <p className="mt-1 text-xs text-ink-soft">
            {mode === 'login' ? '登录后可以发布点位、评论和打分' : '一个账号，记录你走过的每个钓点'}
          </p>
        </div>

        <div className="mt-5 flex rounded-2xl bg-lake-100/70 p-1">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                mode === item ? 'bg-white text-lake-700 shadow-sm' : 'text-ink-soft'
              }`}
            >
              {item === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">邮箱</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none ring-lake-200 focus:ring-2"
            />
          </label>

          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft">昵称</span>
              <input
                required
                maxLength={20}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="钓友看到的名字"
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none ring-lake-200 focus:ring-2"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">密码</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none ring-lake-200 focus:ring-2"
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-2xl bg-lake-500 py-3 text-sm font-bold text-white shadow-soft transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-ink-soft">
          体验账号：demo@wild.fish / demo1234
        </p>
        <p className="mt-1 text-center text-[11px] text-ink-soft">
          <Link to="/" className="font-semibold text-lake-600">
            先随便逛逛 →
          </Link>
        </p>
      </main>
    </>
  )
}
