import { View, Text, Image } from '@tarojs/components'
import type { Material } from '@/types'
import { formatPrice, getBeadColor } from '@/utils/format'
import './index.less'

interface MaterialItemProps {
  material: Material
  mode?: 'list' | 'grid'
  onAdd?: (material: Material) => void
}

export default function MaterialItem({ material, mode = 'grid', onAdd }: MaterialItemProps) {
  const bgColor = getBeadColor(material.name)

  if (mode === 'list') {
    return (
      <View className='material-item material-item--list'>
        <View className='material-item__avatar' style={{ backgroundColor: bgColor }}>
          {material.image_url ? (
            <Image className='material-item__avatar-img' src={material.image_url} mode='aspectFill' />
          ) : (
            <Text className='material-item__avatar-text'>珠</Text>
          )}
        </View>
        <View className='material-item__content'>
          <Text className='material-item__name'>{material.name}</Text>
          <Text className='material-item__desc'>{material.size_mm}mm · {formatPrice(material.price)}/颗</Text>
        </View>
        {onAdd && (
          <View className='material-item__add-btn' onClick={() => onAdd(material)}>
            <Text className='material-item__add-text'>+</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className='material-item material-item--grid' onClick={() => onAdd && onAdd(material)}>
      <View className='material-item__img-wrap' style={{ backgroundColor: bgColor }}>
        {material.image_url ? (
          <Image className='material-item__grid-img' src={material.image_url} mode='aspectFill' />
        ) : (
          <Text className='material-item__grid-placeholder'>珠</Text>
        )}
      </View>
      <View className='material-item__grid-info'>
        <Text className='material-item__grid-name' numberOfLines={1}>{material.name}</Text>
        <Text className='material-item__grid-size'>{material.size_mm}mm</Text>
        <Text className='material-item__grid-price'>{formatPrice(material.price)}</Text>
      </View>
    </View>
  )
}
