import type { DesignItem } from '@/types'

/**
 * Format price as ¥XX.XX
 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

/**
 * Format date string to readable format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calculate wrist size in cm from beads
 * Formula: Σ(size_mm × quantity) ÷ 10
 */
export function calcWristSize(beads: DesignItem[]): number {
  const total = beads.reduce((sum, b) => sum + b.size_mm * b.quantity, 0)
  return Math.round(total) / 10
}

/**
 * Calculate total price from beads
 */
export function calcTotalPrice(beads: DesignItem[]): number {
  return beads.reduce((sum, b) => sum + b.price * b.quantity, 0)
}

/**
 * Get bead color from material name
 */
export function getBeadColor(name: string, defaultColor?: string): string {
  const colorMap: Record<string, string> = {
    '紫水晶': '#9B59B6',
    '巴西紫水晶': '#9B59B6',
    '白水晶': '#ECF0F1',
    '海蓝宝': '#5DADE2',
    '蓝晶石': '#2980B9',
    '黄水晶': '#F1C40F',
    '粉水晶': '#F8B4C8',
    '葡萄石': '#A8D8A8',
    '幽灵水晶': '#BDC3C7',
    '隔片': '#D4AF37',
    '钛钢': '#95A5A6',
  }

  for (const [key, color] of Object.entries(colorMap)) {
    if (name.includes(key)) return color
  }

  return defaultColor || '#6750A4'
}
