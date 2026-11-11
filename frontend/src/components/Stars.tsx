/** 星级展示与打分组件。 */

import { StarIcon } from './Icons'

type DisplayProps = {
  value: number
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

/** 只读星级：支持半星（按 0.5 取整），用于卡片和详情页。 */
export function Stars({ value, count, size = 'sm', className = '' }: DisplayProps) {
  const starClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center gap-0.5 text-sun-400">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, value - index))
          return (
            <span key={index} className={`relative inline-block ${starClass}`}>
              <StarIcon className={`${starClass} absolute inset-0 text-sun-200`} filled />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <StarIcon className={`${starClass} text-sun-400`} filled />
              </span>
            </span>
          )
        })}
      </span>
      <span className="text-xs font-semibold text-ink-soft">
        {value > 0 ? value.toFixed(1) : '暂无'}
        {count !== undefined && count > 0 && <span className="ml-0.5 font-normal text-ink-soft/70">({count})</span>}
      </span>
    </span>
  )
}

type InputProps = {
  value: number
  onChange: (score: number) => void
  disabled?: boolean
}

/** 打分：支持半星，手指落在星星左右半边分别对应 x.5 / x.0。 */
export function RatingInput({ value, onChange, disabled }: InputProps) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`${star} 星`}
          onClick={() => onChange(star)}
          className="group relative h-8 w-8 transition active:scale-90 disabled:opacity-60"
        >
          <StarIcon className="h-8 w-8 text-sun-200" filled />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: value >= star ? '100%' : value >= star - 0.5 ? '50%' : '0%' }}
          >
            <StarIcon className="h-8 w-8 text-sun-400" filled />
          </span>
        </button>
      ))}
    </div>
  )
}
