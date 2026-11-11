/** 接口集合：按资源拆分，页面只依赖这些函数，不直接写 fetch。 */

import { request } from './client'
import type {
  City,
  Comment,
  LocateResult,
  Page,
  SpotDetail,
  SpotListItem,
  SpotSort,
  TokenResponse,
  User
} from './types'

// --- 账号 -----------------------------------------------------------------
export const authApi = {
  register: (payload: { email: string; nickname: string; password: string }) =>
    request<TokenResponse>('/auth/register', { method: 'POST', body: payload }),
  login: (payload: { email: string; password: string }) =>
    request<TokenResponse>('/auth/login', { method: 'POST', body: payload }),
  me: () => request<User>('/auth/me')
}

// --- 城市 -----------------------------------------------------------------
export const cityApi = {
  list: (params: { keyword?: string; hot_only?: boolean }) =>
    request<City[]>('/cities', { query: params }),
  locate: (coords?: { lat: number; lng: number }) =>
    request<LocateResult>('/geo/locate', {
      query: coords ? { lat: coords.lat, lng: coords.lng } : undefined
    })
}

// --- 点位 -----------------------------------------------------------------
export const spotApi = {
  list: (params: {
    city_id?: number
    sort?: SpotSort
    lat?: number
    lng?: number
    keyword?: string
    page?: number
    size?: number
  }) => request<Page<SpotListItem>>('/spots', { query: params }),

  detail: (id: number) => request<SpotDetail>(`/spots/${id}`),

  create: (payload: {
    title: string
    summary?: string
    content: string
    cover_url?: string | null
    city_id: number
    location_name: string
    address?: string | null
    lat: number
    lng: number
    water_type: string
    fee_type: string
    fish_types: string[]
    images?: string[]
  }) => request<SpotDetail>('/spots', { method: 'POST', body: payload }),

  comments: (id: number) => request<Comment[]>(`/spots/${id}/comments`),

  comment: (id: number, payload: { content: string; parent_id?: number | null }) =>
    request<Comment>(`/spots/${id}/comments`, { method: 'POST', body: payload }),

  rate: (id: number, score: number) =>
    request<{ rating_avg: number; rating_count: number; my_rating: number }>(
      `/spots/${id}/rating`,
      { method: 'POST', body: { score } }
    )
}
