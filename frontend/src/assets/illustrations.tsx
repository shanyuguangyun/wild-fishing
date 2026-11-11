/**
 * 手绘风卡通插画（内联 SVG）。
 *
 * 用矢量而不是位图：任意尺寸都清晰、能被 Tailwind 控制配色、体积几乎为零。
 * 四个分类各有独立形象，风格统一为「圆头圆脑 + 低饱和填充 + 深色描边」。
 */

type ArtProps = { className?: string }

/** 点位：一条翘嘴 + 水波 */
export function FishArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <path d="M6 70c8-6 16-6 24 0s16 6 24 0 16-6 24 0 8 5 12 3" stroke="#74d5c2" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 44c8-13 26-18 38-13 5 2 8 6 8 10s-3 9-8 11c-12 5-30 1-38-8Z" fill="#a9e8da" stroke="#10665c" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M30 44 18 34l2 12-4 10 14-6" fill="#ffc071" stroke="#10665c" strokeWidth="3.4" strokeLinejoin="round" />
      <circle cx="63" cy="40" r="3" fill="#16302b" />
      <path d="M44 32c3 6 3 12 0 17" stroke="#10665c" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 55c4 4 8 6 13 6" stroke="#10665c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** 装备：鱼竿 + 渔轮 */
export function RodArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <path d="M20 78 72 22" stroke="#10665c" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M72 22c4-4 10-2 11 3" stroke="#10665c" strokeWidth="4" strokeLinecap="round" />
      <circle cx="34" cy="60" r="9" fill="#ffdba8" stroke="#10665c" strokeWidth="3.4" />
      <circle cx="34" cy="60" r="3" fill="#10665c" />
      <path d="M40 55 66 28" stroke="#74d5c2" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 34c0 20-6 26-6 34" stroke="#8fd8c9" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M66 68c0 5 6 6 6 10" stroke="#10665c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="72" cy="30" r="2.6" fill="#f97f13" />
    </svg>
  )
}

/** 饵料：一条蚯蚓 + 饵球 */
export function BaitArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <path d="M22 30c10-10 22-6 26 2s2 16 8 20 16 2 18 10" stroke="#f4a58a" strokeWidth="10" strokeLinecap="round" />
      <path d="M22 30c10-10 22-6 26 2s2 16 8 20 16 2 18 10" stroke="#e07a5f" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />
      <circle cx="34" cy="66" r="15" fill="#ffdba8" stroke="#10665c" strokeWidth="3.4" />
      <circle cx="28" cy="62" r="2.6" fill="#10665c" />
      <circle cx="39" cy="70" r="2.6" fill="#10665c" />
      <circle cx="34" cy="58" r="2.2" fill="#e06409" />
    </svg>
  )
}

/** 其他：小船 + 水波 */
export function BoatArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <path d="M12 62c8-5 16-5 24 0s16 5 24 0 12-5 20-2" stroke="#74d5c2" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 56h56l-8 14H28z" fill="#ffc071" stroke="#10665c" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M48 56V22" stroke="#10665c" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M48 26c10 4 16 10 18 18H48z" fill="#a9e8da" stroke="#10665c" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M48 26c-8 4-12 10-14 18h14z" fill="#d5f4ec" stroke="#10665c" strokeWidth="3.2" strokeLinejoin="round" />
    </svg>
  )
}

/** 首页顶部的一条装饰水纹，放在标题栏下方 */
export function WaveLine({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 320 24" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
      <path
        d="M0 14c20-10 40-10 60 0s40 10 60 0 40-10 60 0 40 10 60 0 40-10 60 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
