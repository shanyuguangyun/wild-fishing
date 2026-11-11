/** 展示层格式化工具，避免各页面各写一套。 */

/** 距离：<1km 用米，>=1km 用公里保留一位小数。 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / 具体日期。 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

/** 后端把时间存成不带时区的 UTC，展示时转成本地时间。 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
