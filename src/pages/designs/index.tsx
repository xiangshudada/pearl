import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import DesignCard from '@/components/DesignCard'
import { getDesigns } from '@/api/design'
import type { Design } from '@/types'
import './index.less'

type SortType = 'popular' | 'latest'

export default function DesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<SortType>('popular')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setDesigns([])
    setPage(1)
    setHasMore(true)
    loadDesigns(1, sort)
  }, [sort])

  const loadDesigns = async (pageNum: number, sortType: SortType) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await getDesigns({ sort: sortType, page: pageNum, per_page: 10 })
      const items = res.items || []
      setDesigns((prev) => (pageNum === 1 ? items : [...prev, ...items]))
      setHasMore(items.length === 10)
      setPage(pageNum)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (!hasMore || loading) return
    loadDesigns(page + 1, sort)
  }

  const goToDesign = (id: number) => {
    Taro.navigateTo({ url: `/pages/design-detail/index?id=${id}` })
  }

  const leftCol = designs.filter((_, i) => i % 2 === 0)
  const rightCol = designs.filter((_, i) => i % 2 === 1)

  return (
    <ScrollView
      className='designs-page'
      scrollY
      onScrollToLower={handleLoadMore}
    >
      <View className='designs-page__toolbar'>
        <View
          className={`designs-page__sort-btn ${sort === 'popular' ? 'designs-page__sort-btn--active' : ''}`}
          onClick={() => setSort('popular')}
        >
          <Text className='designs-page__sort-text'>热门</Text>
        </View>
        <View
          className={`designs-page__sort-btn ${sort === 'latest' ? 'designs-page__sort-btn--active' : ''}`}
          onClick={() => setSort('latest')}
        >
          <Text className='designs-page__sort-text'>最新</Text>
        </View>
      </View>

      {loading && designs.length === 0 ? (
        <View className='designs-page__loading'>
          <Text className='designs-page__loading-text'>加载中...</Text>
        </View>
      ) : designs.length === 0 ? (
        <View className='designs-page__empty'>
          <Text className='designs-page__empty-text'>暂无设计作品</Text>
        </View>
      ) : (
        <View className='designs-page__waterfall'>
          <View className='designs-page__waterfall-col'>
            {leftCol.map((d) => (
              <DesignCard key={d.id} design={d} onClick={() => goToDesign(d.id)} />
            ))}
          </View>
          <View className='designs-page__waterfall-col'>
            {rightCol.map((d) => (
              <DesignCard key={d.id} design={d} onClick={() => goToDesign(d.id)} />
            ))}
          </View>
        </View>
      )}

      <View className='designs-page__load-more'>
        <Text className='designs-page__load-more-text'>
          {loading ? '加载中...' : hasMore ? '' : '已经到底了'}
        </Text>
      </View>
    </ScrollView>
  )
}
