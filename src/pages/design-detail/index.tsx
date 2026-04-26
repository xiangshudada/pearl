import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import BeadRing from '@/components/BeadRing'
import { getDesign, useDesign } from '@/api/design'
import { useDesignerStore } from '@/store/designer'
import { formatPrice, formatDate, getBeadColor } from '@/utils/format'
import type { Design, DesignItem } from '@/types'
import './index.less'

export default function DesignDetailPage() {
  const router = useRouter()
  const [design, setDesign] = useState<Design | null>(null)
  const [loading, setLoading] = useState(true)
  const loadDesign = useDesignerStore((s) => s.loadDesign)

  const designId = Number(router.params.id)

  useEffect(() => {
    if (designId) {
      fetchDesign(designId)
    }
  }, [designId])

  const fetchDesign = async (id: number) => {
    setLoading(true)
    Taro.showLoading({ title: '加载中...' })
    try {
      const data = await getDesign(id)
      setDesign(data)
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  // Convert API items to flat DesignItems for BeadRing rendering
  const flatItems: DesignItem[] = (design?.items || [])
    .filter((item) => item.material)
    .map((item, i) => ({
      material_id: item.material_id,
      name: item.material!.name,
      size_mm: Number(item.material!.size_mm),
      color: getBeadColor(item.material!.name),
      price: Number(item.material!.price),
      quantity: item.quantity,
      position: item.position !== null ? item.position : i,
    }))

  const handleUseDesign = async () => {
    if (!design) return
    try {
      await useDesign(design.id)
    } catch {
      // non-critical, continue anyway
    }
    loadDesign(design)
    Taro.switchTab({ url: '/pages/designer/index' })
  }

  const handleShareFriend = () => {
    Taro.showToast({ title: '请点击右上角菜单分享', icon: 'none' })
  }

  const handleShareMoments = () => {
    Taro.showToast({ title: '请点击右上角菜单分享', icon: 'none' })
  }

  if (loading) {
    return (
      <View className='detail-page detail-page--loading'>
        <Text className='detail-page__loading-text'>加载中...</Text>
      </View>
    )
  }

  if (!design) {
    return (
      <View className='detail-page detail-page--error'>
        <Text className='detail-page__error-text'>设计不存在</Text>
      </View>
    )
  }

  const authorName = design.author_nickname || design.author?.nickname || '匿名用户'
  const totalPrice = Number(design.total_price)

  return (
    <View className='detail-page'>
      <ScrollView className='detail-page__scroll' scrollY>
        {/* Ring Preview */}
        <View className='detail-page__preview-section'>
          <BeadRing beads={flatItems} size={260} interactive={false} />
        </View>

        {/* Design Name */}
        <View className='detail-page__name-row'>
          <Text className='detail-page__name'>{design.name}</Text>
          <Text className='detail-page__price'>{formatPrice(totalPrice)}</Text>
        </View>

        {/* Tags */}
        {design.tags && design.tags.length > 0 && (
          <View className='detail-page__tags'>
            {design.tags.map((tag, i) => (
              <View key={i} className='detail-page__tag'>
                <Text className='detail-page__tag-text'>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Author info */}
        <View className='detail-page__author-row'>
          <View className='detail-page__author-avatar'>
            <Text className='detail-page__author-avatar-text'>
              {(authorName || '匿')[0]}
            </Text>
          </View>
          <View className='detail-page__author-info'>
            <Text className='detail-page__author-name'>{authorName}</Text>
            <Text className='detail-page__author-meta'>
              {formatDate(design.created_at)} · 被使用 {design.use_count} 次
            </Text>
          </View>
          <View className='detail-page__like-btn'>
            <Text className='detail-page__like-icon'>♥</Text>
            <Text className='detail-page__like-count'>{design.like_count}</Text>
          </View>
        </View>

        {/* Material List */}
        <View className='detail-page__section'>
          <Text className='detail-page__section-title'>材料清单</Text>
          <View className='detail-page__materials'>
            {flatItems.length === 0 ? (
              <View className='detail-page__no-items'>
                <Text className='detail-page__no-items-text'>暂无材料详情</Text>
              </View>
            ) : (
              flatItems.map((item, i) => (
                <View key={i} className='detail-page__material-row'>
                  <View
                    className='detail-page__material-dot'
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className='detail-page__material-name'>{item.name}</Text>
                  <Text className='detail-page__material-size'>{item.size_mm}mm</Text>
                  <Text className='detail-page__material-qty'>× {item.quantity} 颗</Text>
                  <Text className='detail-page__material-price'>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))
            )}
          </View>
          <View className='detail-page__total-row'>
            <Text className='detail-page__total-label'>合计</Text>
            <Text className='detail-page__total-price'>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        <View style={{ height: '160rpx' }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View className='detail-page__actions'>
        <View className='detail-page__action-btn detail-page__action-btn--outline' onClick={handleShareFriend}>
          <Text className='detail-page__action-text'>分享好友</Text>
        </View>
        <View className='detail-page__action-btn detail-page__action-btn--outline' onClick={handleShareMoments}>
          <Text className='detail-page__action-text'>分享朋友圈</Text>
        </View>
        <View className='detail-page__action-btn detail-page__action-btn--fill' onClick={handleUseDesign}>
          <Text className='detail-page__action-text detail-page__action-text--white'>使用此设计</Text>
        </View>
      </View>
    </View>
  )
}
