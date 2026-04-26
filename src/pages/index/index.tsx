import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import DesignCard from '@/components/DesignCard'
import { getDesigns } from '@/api/design'
import type { Design } from '@/types'
import './index.less'

const ANNOUNCEMENTS = [
  '欢迎加入珠了个珠，添加客服珠珠，可以查看设计实拍图 🎉',
  '新人专享优惠券已上线，快去领取吧 💝',
  '每周五新品上架，敬请期待 ✨',
]

export default function IndexPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(false)
  const [announcementIndex] = useState(0)

  useDidShow(() => {
    const tabBar = Taro.getTabBar<{ setSelected: (i: number) => void }>(Taro.getCurrentInstance().page as any)
    tabBar?.setSelected(0)
  })

  useEffect(() => {
    loadDesigns()
  }, [])

  const loadDesigns = async () => {
    setLoading(true)
    Taro.showLoading({ title: '加载中...' })
    try {
      const res = await getDesigns({ sort: 'popular', per_page: 6 })
      setDesigns(res.items || [])
    } catch {
      // Error already handled in request.ts
    } finally {
      setLoading(false)
      Taro.hideLoading()
    }
  }

  const goToDesigner = () => {
    Taro.switchTab({ url: '/pages/designer/index' })
  }

  const goToDesign = (id: number) => {
    Taro.navigateTo({ url: `/pages/design-detail/index?id=${id}` })
  }

  // Split designs into two columns
  const leftCol = designs.filter((_, i) => i % 2 === 0)
  const rightCol = designs.filter((_, i) => i % 2 === 1)

  return (
    <View className='index-page'>
      {/* Announcement Banner */}
      <View className='index-page__banner'>
        <ScrollView
          className='index-page__announcements'
          scrollX
          showScrollbar={false}
        >
          {ANNOUNCEMENTS.map((text, i) => (
            <View key={i} className='index-page__announcement-item'>
              <Text className='index-page__announcement-text'>📢 {text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Quick Entry Cards */}
      <View className='index-page__quick-entries'>
        <View className='index-page__entry-card index-page__entry-card--diy' onClick={goToDesigner}>
          <Text className='index-page__entry-icon'>✨</Text>
          <Text className='index-page__entry-title'>自己 DIY</Text>
          <Text className='index-page__entry-desc'>自由搭配专属手串</Text>
        </View>
        <View className='index-page__entry-card index-page__entry-card--vip'>
          <Text className='index-page__entry-icon'>👑</Text>
          <Text className='index-page__entry-title'>VIP 交流群</Text>
          <Text className='index-page__entry-desc'>加入专属社群</Text>
        </View>
      </View>

      {/* Design Square */}
      <View className='index-page__section'>
        <View className='index-page__section-header'>
          <Text className='index-page__section-title'>设计广场</Text>
          <Text className='index-page__section-subtitle'>热门作品精选</Text>
        </View>

        {loading && designs.length === 0 ? (
          <View className='index-page__loading'>
            <Text className='index-page__loading-text'>加载中...</Text>
          </View>
        ) : (
          <View className='index-page__waterfall'>
            <View className='index-page__waterfall-col'>
              {leftCol.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onClick={() => goToDesign(design.id)}
                />
              ))}
            </View>
            <View className='index-page__waterfall-col'>
              {rightCol.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onClick={() => goToDesign(design.id)}
                />
              ))}
            </View>
          </View>
        )}

        {!loading && designs.length === 0 && (
          <View className='index-page__empty'>
            <Text className='index-page__empty-text'>暂无设计作品</Text>
          </View>
        )}

        {/* More link */}
        <View className='index-page__more' onClick={goToDesigner}>
          <Text className='index-page__more-text'>更多设计作品，进入设计广场 →</Text>
        </View>
      </View>
    </View>
  )
}
