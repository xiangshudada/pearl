import { View, Text } from '@tarojs/components'
import './index.less'

export default function OrdersPage() {
  return (
    <View className='orders-page'>
      <View className='orders-page__placeholder'>
        <Text className='orders-page__placeholder-icon'>📦</Text>
        <Text className='orders-page__placeholder-title'>订单功能即将上线</Text>
        <Text className='orders-page__placeholder-desc'>
          我们正在努力开发订单功能，敬请期待～
        </Text>
      </View>
    </View>
  )
}
