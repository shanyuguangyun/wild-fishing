import type { ReactNode } from 'react'
import { FishArt } from '../assets/illustrations'

/** 空状态 / 加载状态的小组件，统一视觉。 */

export function Spinner({ label = '加载中' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-ink-soft">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-lake-200 border-t-lake-500" />
      <span className="text-xs tracking-wide">{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-12 text-center">
      <FishArt className="h-24 w-24 opacity-80" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="text-xs leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-soft">
      <div className="h-40 animate-pulse bg-lake-100/70" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-lake-100" />
        <div className="h-3 w-full animate-pulse rounded-full bg-lake-50" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-lake-50" />
      </div>
    </div>
  )
}
