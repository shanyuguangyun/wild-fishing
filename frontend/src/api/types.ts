/** 与后端 Pydantic schema 一一对应的类型定义。改后端时同步这里即可。 */

export interface City {
  id: number
  name: string
  province: string
  lat: number
  lng: number
  is_hot: boolean
}

export interface LocateResult {
  city: City
  source: 'coordinate' | 'default' | 'ip'
  distance_m?: number | null
}

export interface User {
  id: number
  email: string
  nickname: string
  avatar_url: string | null
  created_at: string
}

export interface Author {
  id: number
  nickname: string
  avatar_url: string | null
}

export interface SpotListItem {
  id: number
  title: string
  summary: string
  cover_url: string | null
  location_name: string
  water_type: string
  water_type_label: string
  fee_type: string
  fee_type_label: string
  fish_types: string[]
  rating_avg: number
  rating_count: number
  comment_count: number
  view_count: number
  distance_m: number | null
  heat: number
  created_at: string
  city: { id: number; name: string }
  author: Author
}

export interface SpotDetail extends SpotListItem {
  content: string
  address: string | null
  lat: number
  lng: number
  images: string[]
  my_rating: number | null
  is_author: boolean
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
  has_more: boolean
}

export interface Comment {
  id: number
  content: string
  created_at: string
  parent_id: number | null
  user: Author
  is_mine: boolean
}

export type SpotSort = 'distance' | 'rating' | 'hot'

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
