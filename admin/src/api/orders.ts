import apiClient from './client'
import type { PaginatedResponse } from './materials'

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export interface Order {
  id: number
  user_id: number
  user_nickname?: string
  design_id: number
  design_name?: string
  address_id: number
  user_coupon_id: number | null
  total_amount: number
  discount_amount: number
  pay_amount: number
  status: OrderStatus
  wx_transaction_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderListParams {
  page?: number
  per_page?: number
  status?: OrderStatus | ''
  user_id?: number
}

export async function getOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
  const res = await apiClient.get<PaginatedResponse<Order>>('/api/admin/orders', { params })
  return res.data
}
