import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { spotApi } from '../api'
import { ChevronLeftIcon, CloseIcon, PlusIcon } from '../components/Icons'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useCity } from '../hooks/useCity'

const WATER_TYPES = [
  { value: 'river', label: '河流' },
  { value: 'lake', label: '湖泊' },
  { value: 'reservoir', label: '水库' },
  { value: 'pond', label: '黑坑' },
  { value: 'sea', label: '海钓' }
]

// 预置封面：与种子数据同一批卡通插画，避免用户上传图片的复杂度
const COVERS = [
  '/static/covers/cover-lake.webp',
  '/static/covers/cover-river.webp',
  '/static/covers/cover-reservoir.webp',
  '/static/covers/cover-pond.webp',
  '/static/covers/cover-sea.webp',
  '/static/covers/cover-night.webp'
]

const QUICK_FISH = ['鲫鱼', '鲤鱼', '草鱼', '翘嘴', '鲈鱼', '鲢鳙', '黑鱼', '罗非']

/** 发布点位：一个表单，字段都带默认值，尽量少让人打字。 */
export function SpotCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, loading } = useAuth()
  const { city, coords } = useCity()

  const [title, setTitle] = useState('')
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [waterType, setWaterType] = useState('lake')
  const [feeType, setFeeType] = useState('free')
  const [fishTypes, setFishTypes] = useState<string[]>(['鲫鱼'])
  const [fishInput, setFishInput] = useState('')
  const [cover, setCover] = useState<string>(COVERS[0])
  const [content, setContent] = useState('')
  const [lat, setLat] = useState(coords?.lat ? String(coords.lat) : '')
  const [lng, setLng] = useState(coords?.lng ? String(coords.lng) : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 未登录直接引导到登录页，登录成功后回到这里
  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=/spots/new', { replace: true })
  }, [loading, user, navigate])

  // 定位晚于页面打开时，把坐标补进表单
  useEffect(() => {
    if (coords && !lat && !lng) {
      setLat(String(coords.lat))
      setLng(String(coords.lng))
    }
  }, [coords, lat, lng])

  function addFish(name: string) {
    const value = name.trim()
    if (!value) return
    if (fishTypes.includes(value)) return
    if (fishTypes.length >= 5) {
      toast('最多选 5 种鱼', 'info')
      return
    }
    setFishTypes([...fishTypes, value])
    setFishInput('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!city) {
      setError('城市还没定位好，稍后再试')
      return
    }
    if (title.trim().length < 4) {
      setError('标题至少 4 个字')
      return
    }
    if (!lat || !lng) {
      setError('请填写钓点坐标，或允许浏览器定位')
      return
    }
    if (content.trim().length < 10) {
      setError('正文至少 10 个字，说说水情和钓法吧')
      return
    }

    setSubmitting(true)
    try {
      const created = await spotApi.create({
        title: title.trim(),
        summary: content.trim().slice(0, 60),
        content: content.trim(),
        cover_url: cover,
        city_id: city.id,
        location_name: locationName.trim() || title.trim(),
        address: address.trim() || null,
        lat: Number(lat),
        lng: Number(lng),
        water_type: waterType,
        fee_type: feeType,
        fish_types: fishTypes,
        images: []
      })
      toast('发布成功', 'success')
      navigate(`/spots/${created.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-lake-50/90 px-4 pb-3 pt-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-soft"
          aria-label="返回"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-ink">发布点位</h1>
        <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-soft">
          {city?.name ?? '定位中'}
        </span>
      </header>

      <form onSubmit={submit} className="flex-1 space-y-4 px-4 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="例如：千岛湖姜家湾，早晚翘嘴炸水"
              className="mt-1 w-full border-b border-lake-100 pb-2 text-sm font-medium text-ink outline-none placeholder:text-ink-soft/50 focus:border-lake-400"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink-soft">钓点名称</span>
            <input
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              maxLength={120}
              placeholder="具体到湾口 / 桥墩 / 塘号"
              className="mt-1 w-full border-b border-lake-100 pb-2 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-lake-400"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink-soft">详细位置（选填）</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={255}
              placeholder="怎么走、车停哪里"
              className="mt-1 w-full border-b border-lake-100 pb-2 text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-lake-400"
            />
          </label>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink-soft">水域类型</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WATER_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setWaterType(item.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  waterType === item.value ? 'bg-lake-500 text-white' : 'bg-lake-50 text-ink-soft'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold text-ink-soft">收费</p>
          <div className="mt-2 flex gap-2">
            {[
              { value: 'free', label: '免费' },
              { value: 'paid', label: '收费' }
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFeeType(item.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  feeType === item.value ? 'bg-sun-400 text-white' : 'bg-sun-50 text-sun-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold text-ink-soft">目标鱼种（最多 5 个）</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {fishTypes.map((fish) => (
              <span
                key={fish}
                className="inline-flex items-center gap-1 rounded-full bg-lake-50 px-3 py-1.5 text-xs font-medium text-lake-700"
              >
                {fish}
                <button type="button" onClick={() => setFishTypes(fishTypes.filter((f) => f !== fish))}>
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={fishInput}
              onChange={(event) => setFishInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addFish(fishInput)
                }
              }}
              placeholder="输入鱼种后回车"
              className="min-w-0 flex-1 rounded-xl bg-lake-50 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-soft/50"
            />
            <button
              type="button"
              onClick={() => addFish(fishInput)}
              className="grid h-8 w-8 place-items-center rounded-xl bg-lake-500 text-white"
              aria-label="添加鱼种"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_FISH.filter((fish) => !fishTypes.includes(fish)).map((fish) => (
              <button
                key={fish}
                type="button"
                onClick={() => addFish(fish)}
                className="rounded-full border border-dashed border-lake-200 px-2.5 py-1 text-[11px] text-ink-soft"
              >
                + {fish}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-ink-soft">封面</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {COVERS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setCover(url)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                  cover === url ? 'ring-lake-500' : 'ring-transparent'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">坐标</span>
            <div className="mt-1 flex gap-2">
              <input
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                placeholder="纬度"
                inputMode="decimal"
                className="min-w-0 flex-1 rounded-xl bg-lake-50 px-3 py-2 text-xs text-ink outline-none"
              />
              <input
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                placeholder="经度"
                inputMode="decimal"
                className="min-w-0 flex-1 rounded-xl bg-lake-50 px-3 py-2 text-xs text-ink outline-none"
              />
            </div>
          </label>
          <p className="mt-1.5 text-[11px] text-ink-soft/80">
            已自动取当前位置，可手动微调；距离排序和地图都依赖它。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">正文</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              maxLength={20000}
              placeholder="水情、钓法、饵料、注意事项…分段落写更好读"
              className="mt-1 w-full resize-none rounded-xl bg-lake-50 px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-soft/50"
            />
          </label>
        </section>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-lake-500 py-3 text-sm font-bold text-white shadow-soft transition active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? '发布中…' : '发布点位'}
        </button>
      </form>
    </>
  )
}
