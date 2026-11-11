import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { spotApi } from '../api'
import { BoatArt, BaitArt, FishArt, RodArt, WaveLine } from '../assets/illustrations'
import { Header } from '../components/Header'
import { ChevronDownIcon } from '../components/Icons'
import { useAuth } from '../hooks/useAuth'
import { useCity } from '../hooks/useCity'

const CATEGORIES = [
  {
    key: 'spots',
    title: '点位',
    desc: '附近的好钓位',
    to: '/spots',
    Art: FishArt,
    accent: 'from-lake-100 to-lake-50',
    ring: 'text-lake-500'
  },
  {
    key: 'gear',
    title: '装备',
    desc: '竿轮线组搭配',
    to: '/soon/gear',
    Art: RodArt,
    accent: 'from-sun-100 to-sun-50',
    ring: 'text-sun-500'
  },
  {
    key: 'bait',
    title: '饵料',
    desc: '窝料配方分享',
    to: '/soon/bait',
    Art: BaitArt,
    accent: 'from-[#ffeef2] to-[#fff7f4]',
    ring: 'text-[#e07a5f]'
  },
  {
    key: 'other',
    title: '其他',
    desc: '技巧与闲聊',
    to: '/soon/other',
    Art: BoatArt,
    accent: 'from-[#eaf1ff] to-[#f7f9ff]',
    ring: 'text-[#5b7cfa]'
  }
]

/** 首页：标题栏 + 四个分类入口，铺满整屏。 */
export function HomePage() {
  const navigate = useNavigate()
  const { city, loading } = useCity()
  const { user } = useAuth()
  const [spotTotal, setSpotTotal] = useState<number | null>(null)

  // 只为了在卡片上显示「本城收录 N 个点位」，因此只取一条
  useEffect(() => {
    if (!city) return
    let active = true
    spotApi
      .list({ city_id: city.id, size: 1 })
      .then((page) => active && setSpotTotal(page.total))
      .catch(() => active && setSpotTotal(null))
    return () => {
      active = false
    }
  }, [city])

  return (
    <>
      <Header />

      <main className="flex flex-1 flex-col px-5 pb-5">
        <section className="animate-rise pb-1 pt-1">
          <p className="text-xs font-medium text-lake-600">
            {loading ? '正在定位…' : `在 ${city?.name ?? '附近'} 附近`}
          </p>
          <h2 className="mt-1 text-[26px] font-black leading-tight text-ink">
            今天，去哪儿钓？
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            看看钓友们最近在哪儿上鱼，或者分享你的私藏钓点。
          </p>
        </section>

        <WaveLine className="mt-3 h-4 w-full text-lake-200" />

        <section className="mt-3 grid flex-1 auto-rows-fr grid-cols-2 gap-3">
          {CATEGORIES.map(({ key, title, desc, to, Art, accent, ring }, index) => {
            const isSpots = key === 'spots'
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(to)}
                className={`animate-rise group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br ${accent} p-4 text-left shadow-soft transition active:scale-[0.98]`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div>
                  <h3 className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {isSpots && spotTotal !== null ? `${city?.name ?? ''} · ${spotTotal} 个点位` : desc}
                  </p>
                </div>

                <Art
                  className={`absolute -bottom-3 -right-3 h-32 w-32 ${ring} opacity-95 transition group-hover:-rotate-3 group-hover:scale-105`}
                />

                <span className="relative z-10 mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-ink-soft">
                  <ChevronDownIcon className="h-3.5 w-3.5 -rotate-90" />
                </span>
              </button>
            )
          })}
        </section>

        <section className="mt-4">
          {user ? (
            <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-lake-500 text-sm font-bold text-white">
                  {user.nickname.slice(0, 1)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink">{user.nickname}</p>
                  <p className="text-[11px] text-ink-soft">可以发布点位、评论打分</p>
                </div>
              </div>
              <Link to="/spots/new" className="rounded-full bg-lake-500 px-3.5 py-2 text-xs font-semibold text-white">
                发布点位
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-between rounded-2xl border border-dashed border-lake-200 px-4 py-3 text-sm text-ink-soft"
            >
              <span>登录后可以发布点位、评论打分</span>
              <span className="font-semibold text-lake-600">去登录 →</span>
            </Link>
          )}
        </section>
      </main>
    </>
  )
}
