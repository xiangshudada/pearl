import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getMyDesigns } from '@/api/design'
import { useDesignerStore } from '@/store/designer'
import { useUserStore } from '@/store/user'
import { formatDate, formatPrice, getBeadColor } from '@/utils/format'
import type { Design } from '@/types'
import './index.less'

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(false)
  const { user, login } = useUserStore()
  const loadDesign = useDesignerStore((s) => s.loadDesign)
  const reset = useDesignerStore((s) => s.reset)

  useDidShow(() => {
    if (user) {
      fetchDesigns()
    }
  })

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      const data = await getMyDesigns()
      setDesigns(data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleContinueDesign = (design: Design) => {
    loadDesign(design)
    Taro.switchTab({ url: '/pages/designer/index' })
  }

  const handleNewDesign = () => {
    reset()
    Taro.switchTab({ url: '/pages/designer/index' })
  }

  const handleLogin = () => {
    login()
  }

  if (!user) {
    return (
      <View className='my-designs-page'>
        <View className='my-designs-page__not-login'>
          <Text className='my-designs-page__not-login-icon'>✨</Text>
          <Text className='my-designs-page__not-login-title'>登录后查看你的设计</Text>
          <Text className='my-designs-page__not-login-desc'>保存你的创意，随时继续设计</Text>
          <View className='my-designs-page__login-btn' onClick={handleLogin}>
            <Text className='my-designs-page__login-btn-text'>微信一键登录</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='my-designs-page'>
      {/* New design button */}
      <View className='my-designs-page__new-btn' onClick={handleNewDesign}>
        <Text className='my-designs-page__new-icon'>+</Text>
        <Text className='my-designs-page__new-text'>添加新设计</Text>
      </View>

      {/* Loading state */}
      {loading && (
        <View className='my-designs-page__loading'>
          <Text className='my-designs-page__loading-text'>加载中...</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && designs.length === 0 && (
        <View className='my-designs-page__empty'>
          <Text className='my-designs-page__empty-icon'>🎀</Text>
          <Text className='my-designs-page__empty-title'>还没有设计作品</Text>
          <Text className='my-designs-page__empty-desc'>去DIY设计你的第一条手串吧</Text>
          <View className='my-designs-page__go-design' onClick={handleNewDesign}>
            <Text className='my-designs-page__go-design-text'>开始设计</Text>
          </View>
        </View>
      )}

      {/* Design list */}
      {!loading && designs.length > 0 && (
        <ScrollView className='my-designs-page__list' scrollY>
          {designs.map((design) => (
            <View key={design.id} className='my-designs-page__card'>
              {/* Left: bead color preview */}
              <View className='my-designs-page__card-preview'>
                <View className='my-designs-page__card-beads'>
                  {(design.items || []).slice(0, 5).map((item, i) => (
                    <View
                      key={i}
                      className='my-designs-page__card-bead'
                      style={{ backgroundColor: item.material ? getBeadColor(item.material.name) : '#6750A4' }}
                    />
                  ))}
                  {(design.items || []).length === 0 && (
                    <Text className='my-designs-page__card-bead-placeholder'>珠</Text>
                  )}
                </View>
              </View>

              {/* Info */}
              <View className='my-designs-page__card-info'>
                <Text className='my-designs-page__card-name'>{design.name}</Text>
                <View className='my-designs-page__card-meta'>
                  <Text className='my-designs-page__card-date'>{formatDate(design.updated_at)}</Text>
                  <Text className='my-designs-page__card-price'>{formatPrice(design.total_price)}</Text>
                </View>
                <View className='my-designs-page__card-status-row'>
                  <View className={`my-designs-page__status-badge my-designs-page__status-badge--${design.status}`}>
                    <Text className='my-designs-page__status-text'>
                      {design.status === 'draft' ? '草稿' : '已完成'}
                    </Text>
                  </View>
                  {design.is_published && (
                    <View className='my-designs-page__published-badge'>
                      <Text className='my-designs-page__published-text'>已发布</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Continue button */}
              <View
                className='my-designs-page__continue-btn'
                onClick={() => handleContinueDesign(design)}
              >
                <Text className='my-designs-page__continue-text'>继续设计</Text>
              </View>
            </View>
          ))}

          <View style={{ height: '32rpx' }} />
        </ScrollView>
      )}
    </View>
  )
}
