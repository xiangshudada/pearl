import { get } from '@/utils/request'
import type { Material, MaterialCategory } from '@/types'

export function getCategories(): Promise<MaterialCategory[]> {
  return get<MaterialCategory[]>('/api/materials/categories')
}

interface GetMaterialsParams {
  category_id?: number
  name?: string
  wuxing?: string
  size_mm?: number
  page?: number
  per_page?: number
}

interface MaterialsResponse {
  items: Material[]
  total: number
  page: number
  per_page: number
}

export function getMaterials(params: GetMaterialsParams = {}): Promise<MaterialsResponse> {
  return get<MaterialsResponse>('/api/materials', params as Record<string, unknown>)
}
