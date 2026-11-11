import { Link } from 'react-router-dom'
import type { SpotListItem } from '../api/types'
import { formatDistance, formatRelativeTime } from '../utils/format'
import { CommentIcon, EyeIcon } from './Icons'
import { Stars } from './Stars'
import { FishArt } from '../assets/illustrations'

/** 点位卡片：列表页的最小展示单元。 */
export function SpotCard({ spot, index = 0 }: { spot: SpotListItem; index?: number }) {
  return (
    <Link
      to={`/spots/${spot.id}`}
      className="animate-rise block overflow-hidden rounded-card bg-white shadow-soft transition active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="relative h-40 w-full overflow-hidden bg-lake-100">
        {spot.cover_url ? (
          <img
            src={spot.cover_url}
            alt={spot.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-lake-100 to-sun-100">
            <FishArt className="h-24 w-24" />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-lake-700 backdrop-blur">
          {spot.water_type_label} · {spot.fee_type_label}
        </span>

        {spot.distance_m !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {formatDistance(spot.distance_m)}
          </span>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        <h3 className="line-clamp-1 text-[15px] font-bold leading-snug text-ink">{spot.title}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-soft">{spot.summary}</p>

        <div className="flex items-center justify-between pt-0.5">
          <Stars value={spot.rating_avg} count={spot.rating_count} />
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

        <div className="flex items-center justify-between border-t border-lake-50 pt-2.5 text-[11px] text-ink-soft">
          <span className="inline-flex items-center gap-1 truncate">
            <span className="text-lake-500">◎</span>
            {spot.location_name}
          </span>
          <span className="shrink-0">{formatRelativeTime(spot.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
