import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BoatArt, BaitArt, RodArt } from '../assets/illustrations'
import { ChevronLeftIcon } from '../components/Icons'

const CONTENT: Record<string, { title: string; desc: string; Art: typeof RodArt }> = {
  gear: {
    title: '装备',
    desc: '竿、轮、线组的搭配心得正在整理，很快和大家见面。',
    Art: RodArt
  },
  bait: {
    title: '饵料',
    desc: '季节窝料配方、商品饵搭配，正在邀请老钓友供稿。',
    Art: BaitArt
  },
  other: {
    title: '其他',
    desc: '技巧、天气、鱼情闲聊，这里会是一个自由的角落。',
    Art: BoatArt
  }
}

/** 装备 / 饵料 / 其他三个分类的占位页，先给出明确的上线预期。 */
export function SoonPage() {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const data = CONTENT[key ?? ''] ?? CONTENT.other

  useEffect(() => {
    document.title = `${data.title} · 野钓客`
  }, [data.title])

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

      <main className="flex flex-1 flex-col items-center justify-center px-10 pb-16 text-center">
        <data.Art className="h-40 w-40" />
        <h1 className="mt-4 text-2xl font-black text-ink">{data.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{data.desc}</p>
        <span className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-lake-600 shadow-soft">
          正在打磨中 · 敬请期待
        </span>
      </main>
    </>
  )
}
