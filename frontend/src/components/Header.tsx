import { useState } from 'react'
import { useCity } from '../hooks/useCity'
import { ChevronDownIcon, PinIcon } from './Icons'
import { CityPicker } from './CityPicker'

/** 顶部标题栏：左侧品牌，右侧当前城市（可切换）。 */
export function Header() {
  const { city, loading } = useCity()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-lake-50/80 px-5 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-soft">
              <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
                <path d="M6 21c7-9 15-10 21-7-1 6-7 10-14 9Z" fill="#a9e8da" stroke="#10665c" strokeWidth="1.8" />
                <path d="M6 21 2 17l1 4-1 4 4-2" fill="#ffc071" stroke="#10665c" strokeWidth="1.8" />
                <circle cx="22" cy="18" r="1.4" fill="#16302b" />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-lake-600/70">WILD FISHING</p>
              <h1 className="text-[17px] font-bold text-ink">野钓客</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-ink shadow-soft transition active:scale-95"
          >
            <PinIcon className="h-4 w-4 text-lake-500" />
            <span className="max-w-20 truncate">{loading ? '定位中' : (city?.name ?? '选择城市')}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-ink-soft" />
          </button>
        </div>
      </header>

      {pickerOpen && <CityPicker onClose={() => setPickerOpen(false)} />}
    </>
  )
}
