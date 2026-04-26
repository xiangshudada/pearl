import { get, post, put, del } from '@/utils/request'
import type { Address } from '@/types'

export function getAddresses(): Promise<Address[]> {
  return get<Address[]>('/api/addresses')
}

export function getAddress(id: number): Promise<Address> {
  return get<Address>(`/api/addresses/${id}`)
}

interface AddressData {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default?: boolean
}

export function createAddress(data: AddressData): Promise<Address> {
  return post<Address>('/api/addresses', data as unknown as Record<string, unknown>)
}

export function updateAddress(id: number, data: Partial<AddressData>): Promise<Address> {
  return put<Address>(`/api/addresses/${id}`, data as unknown as Record<string, unknown>)
}

export function deleteAddress(id: number): Promise<void> {
  return del<void>(`/api/addresses/${id}`)
}
