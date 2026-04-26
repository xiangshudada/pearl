import { View, Text, Image } from '@tarojs/components'
import type { Design } from '@/types'
import { formatPrice } from '@/utils/format'
import './index.less'

interface DesignCardProps {
  design: Design
  onClick?: () => void
}

export default function DesignCard({ design, onClick }: DesignCardProps) {
  const authorName = design.author_nickname || design.author?.nickname || '匿名用户'

  return (
    <View className='design-card' onClick={onClick}>
      {/* Preview */}
      <View className='design-card__preview'>
        {design.preview_url ? (
          <Image
            className='design-card__img'
            src={design.preview_url}
            mode='aspectFill'
            lazyLoad
          />
        ) : (
          <View className='design-card__placeholder'>
            <Text className='design-card__placeholder-text'>珠</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className='design-card__info'>
        <Text className='design-card__name'>{design.name}</Text>

        <View className='design-card__meta'>
          <Text className='design-card__author'>{authorName}</Text>
          <Text className='design-card__use-count'>{design.use_count} 人使用</Text>
        </View>

        <View className='design-card__footer'>
          <Text className='design-card__price'>{formatPrice(Number(design.total_price))}</Text>
          {design.like_count > 0 && (
            <Text className='design-card__likes'>♥ {design.like_count}</Text>
          )}
        </View>
      </View>
    </View>
  )
}
