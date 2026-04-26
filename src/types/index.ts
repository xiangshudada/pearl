export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  is_admin: number
  created_at: string
}

export interface MaterialCategory {
  id: number
  parent_id: number | null
  name: string
  sort_order: number
  children?: MaterialCategory[]
}

export interface Material {
  id: number
  category_id: number
  name: string
  size_mm: number
  price: number
  wuxing: '金' | '木' | '水' | '火' | '土' | null
  image_url: string
  stock: number
  is_active: number
  sort_order: number
  created_at?: string
  updated_at?: string
}

/**
 * DesignItem as stored in the designer store (flattened, with color for rendering)
 */
export interface DesignItem {
  material_id: number
  name: string
  size_mm: number
  color: string
  image_url?: string
  price: number
  quantity: number
  position: number
}

/**
 * DesignItemOut as returned by the API (may include nested material)
 */
export interface ApiDesignItem {
  id?: number
  design_id?: number
  material_id: number
  quantity: number
  position: number | null
  material?: Material
}

export interface Design {
  id: number
  user_id: number
  name: string
  tags: string[]
  wrist_size: number | null
  preview_url: string | null
  total_price: number
  is_published: number | boolean
  like_count: number
  use_count: number
  status: 'draft' | 'completed'
  created_at: string
  updated_at: string
  items?: ApiDesignItem[]
  author_nickname?: string | null
  author_avatar?: string | null
  liked_by_me?: boolean
  // legacy field for convenience
  author?: User
}

export interface Address {
  id: number
  user_id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: boolean | number
  created_at: string
}

export interface CouponTemplate {
  id: number
  name: string
  type: 'fixed' | 'percent' | 'free_shipping'
  discount: number
  min_amount: number | null
  expired_days: number
}

export interface Coupon {
  id: number
  user_id: number
  template_id: number
  template?: CouponTemplate
  // flattened convenience fields (may be populated from template)
  discount: number
  type: 'fixed' | 'percent' | 'free_shipping'
  min_amount: number | null
  expired_at: string
  used_at: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}
