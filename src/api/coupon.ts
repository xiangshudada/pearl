import { get } from '@/utils/request'

export interface ApiCouponTemplate {
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

export interface ApiUserCoupon {
  id: number
  user_id: number
  template_id: number
  used_at: string | null
  expired_at: string
  created_at: string
  template: ApiCouponTemplate | null
}

export function getCoupons(): Promise<ApiUserCoupon[]> {
  return get<ApiUserCoupon[]>('/api/coupons')
}
