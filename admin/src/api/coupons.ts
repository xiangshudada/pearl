import apiClient from './client'

export interface CouponTemplate {
  id: number
  name: string
  type: 'fixed' | 'percent' | 'free_shipping'
  discount: number
  min_amount: number | null
  total_count: number | null
  issued_count: number
  expired_days: number
  created_at: string
}

export async function getCouponTemplates(): Promise<CouponTemplate[]> {
  const res = await apiClient.get<CouponTemplate[]>('/api/admin/coupon-templates')
  return res.data
}

export async function createTemplate(data: Partial<CouponTemplate>): Promise<CouponTemplate> {
  const res = await apiClient.post<CouponTemplate>('/api/admin/coupon-templates', data)
  return res.data
}

export async function updateTemplate(
  id: number,
  data: Partial<CouponTemplate>
): Promise<CouponTemplate> {
  const res = await apiClient.put<CouponTemplate>(`/api/admin/coupon-templates/${id}`, data)
  return res.data
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/coupon-templates/${id}`)
}

export interface DistributeResult {
  distributed_count: number
  message: string
}

export async function distributeToAll(id: number): Promise<DistributeResult> {
  const res = await apiClient.post<DistributeResult>(
    `/api/admin/coupon-templates/${id}/distribute`
  )
  return res.data
}
