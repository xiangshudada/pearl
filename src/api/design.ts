import { get, post, put, del } from '@/utils/request'
import type { Design } from '@/types'

interface GetDesignsParams {
  sort?: 'popular' | 'latest'
  page?: number
  per_page?: number
}

interface DesignsResponse {
  items: Design[]
  total: number
  page: number
  per_page: number
}

export function getDesigns(params: GetDesignsParams = {}): Promise<DesignsResponse> {
  return get<DesignsResponse>('/api/designs', params as Record<string, unknown>)
}

export function getMyDesigns(): Promise<Design[]> {
  return get<Design[]>('/api/designs/my')
}

export function getDesign(id: number): Promise<Design> {
  return get<Design>(`/api/designs/${id}`)
}

export interface DesignItemPayload {
  material_id: number
  quantity: number
  position?: number
}

export interface CreateDesignData {
  name?: string
  items?: DesignItemPayload[]
  tags?: string[]
  wrist_size?: number
  total_price?: number
  preview_url?: string
  status?: 'draft' | 'completed'
  is_published?: boolean | number
}

export function createDesign(data: CreateDesignData): Promise<Design> {
  return post<Design>('/api/designs', data as unknown as Record<string, unknown>)
}

export function updateDesign(id: number, data: CreateDesignData): Promise<Design> {
  return put<Design>(`/api/designs/${id}`, data as unknown as Record<string, unknown>)
}

export function deleteDesign(id: number): Promise<void> {
  return del<void>(`/api/designs/${id}`)
}

export function likeDesign(id: number): Promise<{ liked: boolean; like_count: number }> {
  return post<{ liked: boolean; like_count: number }>(`/api/designs/${id}/like`)
}

export function useDesign(id: number): Promise<{ use_count: number }> {
  return post<{ use_count: number }>(`/api/designs/${id}/use`)
}
