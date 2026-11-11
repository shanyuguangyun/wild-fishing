import { useEffect, useMemo, useState } from 'react'
import { cityApi } from '../api'
import type { City } from '../api/types'
import { useCity } from '../hooks/useCity'
import { useToast } from './Toast'
import { CloseIcon, PinIcon, SearchIcon } from './Icons'

/**
 * 城市选择弹层。
 *
 * 默认展示热门城市；输入关键词按城市名或拼音搜索（后端已做模糊匹配）。
 * 定位按钮可以重新申请浏览器定位，用于「换了地方想重新定位」的场景。
 */
export function CityPicker({ onClose }: { onClose: () => void }) {
  const { city, setCity, relocalize } = useCity()
  const toast = useToast()
  const [keyword, setKeyword] = useState('')
  const [hotCities, setHotCities] = useState<City[]>([])
  const [results, setResults] = useState<City[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    cityApi.list({ hot_only: true }).then(setHotCities).catch(() => setHotCities([]))
  }, [])

  // 关键词搜索做 300ms 防抖，避免每敲一个字都打一次接口
  useEffect(() => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = window.setTimeout(() => {
      cityApi
        .list({ keyword: trimmed })
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [keyword])

  const list = useMemo(() => (keyword.trim() ? results : hotCities), [keyword, results, hotCities])

  function choose(next: City) {
    setCity(next)
    toast(`已切换到 ${next.name}`, 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 backdrop-blur-sm">
      <button type="button" aria-label="关闭" className="absolute inset-0" onClick={onClose} />

      <div className="animate-rise relative w-full max-w-[440px] rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">选择城市</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-lake-50 text-ink-soft"
            aria-label="关闭"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-lake-50 px-3 py-2.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            autoFocus
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索城市名或拼音，如 hangzhou"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
          />
        </div>

        <button
          type="button"
          onClick={async () => {
            await relocalize()
            toast('已按当前位置重新定位', 'success')
          }}
          className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-dashed border-lake-200 px-3 py-2.5 text-sm font-medium text-lake-600"
        >
          <PinIcon className="h-4 w-4" />
          使用当前位置定位
        </button>

        <p className="mb-2 mt-5 text-xs font-semibold tracking-wide text-ink-soft">
          {keyword.trim() ? (searching ? '搜索中…' : `找到 ${list.length} 个城市`) : '热门城市'}
        </p>

        <div className="grid max-h-[38vh] grid-cols-3 gap-2 overflow-y-auto no-scrollbar">
          {list.map((item) => {
            const active = item.id === city?.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item)}
                className={`rounded-xl px-2 py-2.5 text-sm font-medium transition active:scale-95 ${
                  active
                    ? 'bg-lake-500 text-white shadow-soft'
                    : 'bg-lake-50 text-ink hover:bg-lake-100'
                }`}
              >
                {item.name}
              </button>
            )
          })}
          {!list.length && !searching && (
            <p className="col-span-3 py-6 text-center text-xs text-ink-soft">没有找到这个城市</p>
          )}
        </div>
      </div>
    </div>
  )
}
