import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { spotApi } from '../api'
import type { SpotListItem, SpotSort } from '../api/types'
import { ChevronLeftIcon, PlusIcon } from '../components/Icons'
import { SpotCard } from '../components/SpotCard'
import { EmptyState, SkeletonCard } from '../components/State'
import { useCity } from '../hooks/useCity'
import { useToast } from '../components/Toast'

const SORTS: { key: SpotSort; label: string; hint: string }[] = [
  { key: 'distance', label: '距离', hint: '离你最近的钓点' },
  { key: 'rating', label: '评分', hint: '钓友评分最高' },
  { key: 'hot', label: '近期热度', hint: '最近 7 天最活跃' }
]

const PAGE_SIZE = 10

/** 点位二级页：三个排序 tab + 点位列表。 */
export function SpotsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { city, coords, relocalize } = useCity()

  const [sort, setSort] = useState<SpotSort>('hot')
  const [items, setItems] = useState<SpotListItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // 请求序号：快速切换 tab 时丢弃过期响应，避免旧数据覆盖新数据
  const requestId = useRef(0)

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!city) return
      const current = ++requestId.current
      append ? setLoadingMore(true) : setLoading(true)

      try {
        const result = await spotApi.list({
          city_id: city.id,
          sort,
          lat: coords?.lat,
          lng: coords?.lng,
          page: nextPage,
          size: PAGE_SIZE
        })
        if (current !== requestId.current) return
        setItems((prev) => (append ? [...prev, ...result.items] : result.items))
        setHasMore(result.has_more)
        setTotal(result.total)
        setPage(nextPage)
      } catch (error) {
        if (current === requestId.current) {
          toast(error instanceof Error ? error.message : '加载失败', 'error')
        }
      } finally {
        if (current === requestId.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [city, coords, sort, toast]
  )

  useEffect(() => {
    setItems([])
    void load(1, false)
  }, [load])

  const activeSort = SORTS.find((item) => item.key === sort)!

  return (
    <>
      <header className="sticky top-0 z-30 bg-lake-50/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-soft"
            aria-label="返回"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-center leading-tight">
            <h1 className="text-base font-bold text-ink">点位</h1>
            <p className="text-[11px] text-ink-soft">{city?.name ?? '定位中'} · {total} 个钓点</p>
          </div>

          <Link
            to="/spots/new"
            className="grid h-9 w-9 place-items-center rounded-full bg-lake-500 text-white shadow-soft"
            aria-label="发布点位"
          >
            <PlusIcon className="h-5 w-5" />
          </Link>
        </div>

        {/* 三个排序 tab：等宽铺满，选中态用白底卡片强调 */}
        <div className="mt-3 flex gap-1 rounded-2xl bg-lake-100/70 p-1">
          {SORTS.map((item) => {
            const active = item.key === sort
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSort(item.key)}
                className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition ${
                  active ? 'bg-white text-lake-700 shadow-sm' : 'text-ink-soft'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <p className="mb-3 mt-1 text-[11px] text-ink-soft">{activeSort.hint}</p>

        {sort === 'distance' && !coords && (
          <button
            type="button"
            onClick={() => relocalize()}
            className="mb-3 w-full rounded-2xl border border-dashed border-lake-200 bg-white/70 px-4 py-3 text-left text-xs text-ink-soft"
          >
            没有拿到你的位置，暂时按热度排序。
            <span className="ml-1 font-semibold text-lake-600">点此开启定位 →</span>
          </button>
        )}

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="这个城市还没有点位"
            description="来当第一个分享的人吧，附上位置和鱼种，钓友会感谢你。"
            action={
              <Link to="/spots/new" className="rounded-full bg-lake-500 px-4 py-2 text-sm font-semibold text-white">
                发布第一个点位
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((spot, index) => (
              <SpotCard key={spot.id} spot={spot} index={index} />
            ))}

            {hasMore && (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => load(page + 1, true)}
                className="w-full rounded-full border border-lake-200 py-2.5 text-sm font-semibold text-lake-600 disabled:opacity-60"
              >
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            )}

            {!hasMore && <p className="py-2 text-center text-[11px] text-ink-soft/70">已经到底啦</p>}
          </div>
        )}
      </main>
    </>
  )
}
