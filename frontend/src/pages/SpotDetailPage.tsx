import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { spotApi } from '../api'
import type { Comment, SpotDetail } from '../api/types'
import { ChevronLeftIcon, CommentIcon, EyeIcon, PinIcon } from '../components/Icons'
import { RatingInput, Stars } from '../components/Stars'
import { EmptyState, Spinner } from '../components/State'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { formatDateTime, formatRelativeTime } from '../utils/format'

/** 点位详情：图文、评分、评论。 */
export function SpotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const spotId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [spot, setSpot] = useState<SpotDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ratingSaving, setRatingSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [detail, list] = await Promise.all([spotApi.detail(spotId), spotApi.comments(spotId)])
      setSpot(detail)
      setComments(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [spotId])

  useEffect(() => {
    void load()
  }, [load])

  /** 评论按 parent_id 组装成两层：根评论 + 它的回复。 */
  const grouped = useMemo(() => {
    const roots = comments.filter((item) => item.parent_id === null)
    const replies = new Map<number, Comment[]>()
    comments
      .filter((item) => item.parent_id !== null)
      .forEach((item) => {
        const list = replies.get(item.parent_id!) ?? []
        list.push(item)
        replies.set(item.parent_id!, list)
      })
    return { roots, replies }
  }, [comments])

  function requireLogin(): boolean {
    if (user) return false
    toast('登录后才能操作', 'info')
    navigate(`/login?redirect=/spots/${spotId}`)
    return true
  }

  async function handleRate(score: number) {
    if (!spot || requireLogin()) return
    const previous = spot.my_rating
    setSpot({ ...spot, my_rating: score })
    setRatingSaving(true)
    try {
      const result = await spotApi.rate(spot.id, score)
      setSpot((current) =>
        current
          ? {
              ...current,
              my_rating: result.my_rating,
              rating_avg: result.rating_avg,
              rating_count: result.rating_count
            }
          : current
      )
      toast('评分已更新', 'success')
    } catch (err) {
      setSpot((current) => (current ? { ...current, my_rating: previous } : current))
      toast(err instanceof Error ? err.message : '评分失败', 'error')
    } finally {
      setRatingSaving(false)
    }
  }

  async function submitComment() {
    const content = draft.trim()
    if (!content) return
    if (requireLogin()) return
    setSubmitting(true)
    try {
      const created = await spotApi.comment(spotId, { content, parent_id: replyTo?.id ?? null })
      setComments((prev) => [...prev, created])
      setSpot((current) => (current ? { ...current, comment_count: current.comment_count + 1 } : current))
      setDraft('')
      setReplyTo(null)
      toast('评论已发布', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : '发布失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="正在加载点位" />

  if (error || !spot) {
    return (
      <div className="p-6">
        <EmptyState
          title="点位走丢了"
          description={error || '可能已经被作者删除'}
          action={
            <Link to="/spots" className="rounded-full bg-lake-500 px-4 py-2 text-sm font-semibold text-white">
              返回列表
            </Link>
          }
        />
      </div>
    )
  }

  const paragraphs = spot.content.split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <div className="relative">
        <div className="relative h-56 w-full overflow-hidden bg-lake-100">
          {spot.cover_url ? (
            <img src={spot.cover_url} alt={spot.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-lake-200 to-sun-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/10" />
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur"
          aria-label="返回"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <main className="-mt-6 flex-1 rounded-t-[28px] bg-white px-5 pb-40 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-lake-50 px-2.5 py-1 text-[11px] font-semibold text-lake-700">
            {spot.water_type_label}
          </span>
          <span className="rounded-full bg-sun-50 px-2.5 py-1 text-[11px] font-semibold text-sun-600">
            {spot.fee_type_label}
          </span>
          {spot.fish_types.map((fish) => (
            <span key={fish} className="rounded-full bg-lake-50/60 px-2.5 py-1 text-[11px] text-ink-soft">
              {fish}
            </span>
          ))}
        </div>

        <h1 className="mt-3 text-[22px] font-black leading-snug text-ink">{spot.title}</h1>

        <div className="mt-2 flex items-center justify-between">
          <Stars value={spot.rating_avg} count={spot.rating_count} size="md" />
          <div className="flex items-center gap-3 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <CommentIcon className="h-3.5 w-3.5" />
              {spot.comment_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="h-3.5 w-3.5" />
              {spot.view_count}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-y border-lake-50 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lake-100 text-sm font-bold text-lake-700">
            {spot.author.nickname.slice(0, 1)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{spot.author.nickname}</p>
            <p className="text-[11px] text-ink-soft">
              {spot.city.name} · {formatRelativeTime(spot.created_at)}发布
            </p>
          </div>
        </div>

        {/* 评分区：登录后可直接点星，未登录引导登录 */}
        <section className="mt-4 rounded-2xl bg-lake-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">这个钓点怎么样？</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {user
                  ? spot.my_rating
                    ? `你已打 ${spot.my_rating.toFixed(1)} 分，点击可修改`
                    : '点星星打分，帮钓友判断值不值得跑一趟'
                  : '登录后可以为这个钓点打分'}
              </p>
            </div>
            {!user && (
              <Link
                to={`/login?redirect=/spots/${spot.id}`}
                className="shrink-0 rounded-full bg-lake-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                去登录
              </Link>
            )}
          </div>
          {user && (
            <div className="mt-2">
              <RatingInput value={spot.my_rating ?? 0} onChange={handleRate} disabled={ratingSaving} />
            </div>
          )}
        </section>

        <article className="mt-5 space-y-3 text-[14px] leading-[1.85] text-ink/90">
          {paragraphs.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </article>

        {spot.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {spot.images.map((url) => (
              <img key={url} src={url} alt="" className="h-32 w-full rounded-2xl object-cover" loading="lazy" />
            ))}
          </div>
        )}

        <section className="mt-5 rounded-2xl border border-lake-100 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <PinIcon className="h-4 w-4 text-lake-500" />
            {spot.location_name}
          </p>
          {spot.address && <p className="mt-1 text-xs text-ink-soft">{spot.address}</p>}
          <p className="mt-1 text-[11px] text-ink-soft/80">
            坐标 {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
          </p>
          <a
            href={`https://uri.amap.com/marker?position=${spot.lng},${spot.lat}&name=${encodeURIComponent(spot.title)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-lake-500 px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            在高德地图中查看 →
          </a>
        </section>

        {/* 评论区 */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-ink">
            钓友评论 <span className="text-ink-soft">({spot.comment_count})</span>
          </h2>

          {grouped.roots.length === 0 ? (
            <p className="py-8 text-center text-xs text-ink-soft">还没有评论，来问一句水情吧</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {grouped.roots.map((comment) => (
                <li key={comment.id} className="rounded-2xl bg-lake-50/50 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-lake-700">
                      {comment.user.nickname.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-ink">{comment.user.nickname}</p>
                        <span className="shrink-0 text-[10px] text-ink-soft/70">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink/90">
                        {comment.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => setReplyTo(comment)}
                        className="mt-1.5 text-[11px] font-semibold text-lake-600"
                      >
                        回复
                      </button>

                      {(grouped.replies.get(comment.id) ?? []).map((reply) => (
                        <div key={reply.id} className="mt-2.5 rounded-xl bg-white/80 p-2.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[11px] font-semibold text-ink">
                              {reply.user.nickname}
                              <span className="ml-1 font-normal text-ink-soft">回复</span>
                            </p>
                            <span className="shrink-0 text-[10px] text-ink-soft/70">
                              {formatRelativeTime(reply.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink/85">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* 底部评论输入条：固定在 440px 容器内，避免移动端被键盘顶飞 */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t border-lake-100 bg-white/95 px-4 py-3 backdrop-blur">
        {replyTo && (
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-soft">
            <span>回复 {replyTo.user.nickname}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="font-semibold text-lake-600">
              取消
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={() => {
              if (!user) requireLogin()
            }}
            rows={1}
            maxLength={500}
            placeholder={user ? '说点什么…' : '登录后参与评论'}
            className="max-h-24 flex-1 resize-none rounded-2xl bg-lake-50 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-lake-200"
          />
          <button
            type="button"
            disabled={submitting || !draft.trim()}
            onClick={submitComment}
            className="h-10 shrink-0 rounded-full bg-lake-500 px-4 text-sm font-semibold text-white disabled:opacity-45"
          >
            {submitting ? '发送中' : '发送'}
          </button>
        </div>
      </div>
    </>
  )
}
