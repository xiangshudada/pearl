import apiClient from './client'
import type { PaginatedResponse } from './materials'

export interface Design {
  id: number
  user_id: number
  user_nickname?: string
  name: string
  wrist_size: number | null
  preview_url: string | null
  total_price: number
  is_published: boolean
  like_count: number
  use_count: number
  status: 'draft' | 'completed'
  created_at: string
  updated_at: string
}

export interface DesignListParams {
  page?: number
  per_page?: number
  name?: string
  is_published?: boolean | string | number
}

export async function getDesigns(params?: DesignListParams): Promise<PaginatedResponse<Design>> {
  const res = await apiClient.get<PaginatedResponse<Design>>('/api/admin/designs', { params })
  return res.data
}

export async function togglePublish(id: number): Promise<Design> {
  const res = await apiClient.put<Design>(`/api/admin/designs/${id}/publish`)
  return res.data
}
