import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { getCoupons, type ApiUserCoupon } from '@/api/coupon'
import { formatDate } from '@/utils/format'
import './index.less'

type TabType = 'unused' | 'used' | 'expired'

function getCouponTypeLabel(type: string): string {
  switch (type) {
    case 'fixed':
      return '满减券'
    case 'percent':
      return '折扣券'
    case 'free_shipping':
      return '免邮券'
    default:
      return '优惠券'
  }
}

function getCouponDesc(coupon: ApiUserCoupon): string {
  const tmpl = coupon.template
  if (!tmpl) return ''
  switch (tmpl.type) {
    case 'fixed':
      return tmpl.min_amount
        ? `满 ¥${tmpl.min_amount} 减 ¥${tmpl.discount}`
        : `立减 ¥${tmpl.discount}`
    case 'percent':
      return `打 ${(Number(tmpl.discount) * 10).toFixed(1)} 折`
    case 'free_shipping':
      return '免运费'
    default:
      return ''
  }
}

function isExpired(coupon: ApiUserCoupon): boolean {
  return new Date(coupon.expired_at) < new Date()
}

export default function CouponPage() {
  const [coupons, setCoupons] = useState<ApiUserCoupon[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('unused')

  useDidShow(() => {
    fetchCoupons()
  })

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const data = await getCoupons()
      setCoupons(data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const unusedCoupons = coupons.filter((c) => !c.used_at && !isExpired(c))
  const usedCoupons = coupons.filter((c) => !!c.used_at)
  const expiredCoupons = coupons.filter((c) => !c.used_at && isExpired(c))

  const tabCoupons: Record<TabType, ApiUserCoupon[]> = {
    unused: unusedCoupons,
    used: usedCoupons,
    expired: expiredCoupons,
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'unused', label: '未使用', count: unusedCoupons.length },
    { key: 'used', label: '已使用', count: usedCoupons.length },
    { key: 'expired', label: '已过期', count: expiredCoupons.length },
  ]

  const displayCoupons = tabCoupons[activeTab]

  return (
    <View className='coupon-page'>
      {/* Tabs */}
      <View className='coupon-page__tabs'>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={`coupon-page__tab ${activeTab === tab.key ? 'coupon-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className='coupon-page__tab-text'>{tab.label}</Text>
            {tab.count > 0 && (
              <View className='coupon-page__tab-badge'>
                <Text className='coupon-page__tab-badge-text'>{tab.count}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <ScrollView className='coupon-page__scroll' scrollY>
        {loading && (
          <View className='coupon-page__loading'>
            <Text className='coupon-page__loading-text'>加载中...</Text>
          </View>
        )}

        {!loading && displayCoupons.length === 0 && (
          <View className='coupon-page__empty'>
            <Text className='coupon-page__empty-icon'>🎫</Text>
            <Text className='coupon-page__empty-title'>
              {activeTab === 'unused'
                ? '暂无可用优惠券'
                : activeTab === 'used'
                ? '暂无已使用的优惠券'
                : '暂无已过期的优惠券'}
            </Text>
            {activeTab === 'unused' && (
              <Text className='coupon-page__empty-desc'>完成任务或参与活动可获得优惠券</Text>
            )}
          </View>
        )}

        {displayCoupons.map((coupon) => {
          const tmpl = coupon.template
          const type = tmpl?.type || 'fixed'
          const discount = Number(tmpl?.discount || 0)

          return (
            <View
              key={coupon.id}
              className={`coupon-page__card ${activeTab !== 'unused' ? 'coupon-page__card--dimmed' : ''}`}
            >
              {/* Left: discount info */}
              <View className='coupon-page__card-left'>
                {type === 'fixed' ? (
                  <View className='coupon-page__amount-wrap'>
                    <Text className='coupon-page__amount-symbol'>¥</Text>
                    <Text className='coupon-page__amount'>{discount}</Text>
                  </View>
                ) : type === 'percent' ? (
                  <View className='coupon-page__amount-wrap'>
                    <Text className='coupon-page__amount'>{(discount * 10).toFixed(1)}</Text>
                    <Text className='coupon-page__amount-symbol'>折</Text>
                  </View>
                ) : (
                  <Text className='coupon-page__free-ship'>免邮</Text>
                )}
                <Text className='coupon-page__card-type'>
                  {getCouponTypeLabel(type)}
                </Text>
              </View>

              {/* Divider */}
              <View className='coupon-page__card-divider'>
                <View className='coupon-page__notch coupon-page__notch--top' />
                <View className='coupon-page__dashed-line' />
                <View className='coupon-page__notch coupon-page__notch--bottom' />
              </View>

              {/* Right: details */}
              <View className='coupon-page__card-right'>
                <Text className='coupon-page__card-name'>
                  {tmpl?.name || getCouponDesc(coupon)}
                </Text>
                <Text className='coupon-page__card-condition'>
                  {getCouponDesc(coupon)}
                </Text>
                <Text className='coupon-page__card-expire'>
                  有效期至 {formatDate(coupon.expired_at)}
                </Text>
                {coupon.used_at && (
                  <Text className='coupon-page__card-used-at'>
                    已于 {formatDate(coupon.used_at)} 使用
                  </Text>
                )}
              </View>

              {/* Status stamp */}
              {activeTab === 'used' && (
                <View className='coupon-page__stamp coupon-page__stamp--used'>
                  <Text className='coupon-page__stamp-text'>已使用</Text>
                </View>
              )}
              {activeTab === 'expired' && (
                <View className='coupon-page__stamp coupon-page__stamp--expired'>
                  <Text className='coupon-page__stamp-text'>已过期</Text>
                </View>
              )}
            </View>
          )
        })}

        <View style={{ height: '48rpx' }} />
      </ScrollView>
    </View>
  )
}
