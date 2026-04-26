import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/user'
import './index.less'

interface MenuItem {
  icon: string
  label: string
  desc?: string
  badge?: number
  onClick: () => void
}

export default function ProfilePage() {
  const { user, login, logout } = useUserStore()

  useDidShow(() => {
    // Sync tab bar selection
    const tabBar = Taro.getTabBar<{ setSelected: (i: number) => void }>(Taro.getCurrentInstance().page as any)
    tabBar?.setSelected(2)
  })

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleLogin = () => {
    login()
  }

  const menuItems: MenuItem[] = [
    {
      icon: '✨',
      label: '我的设计',
      desc: '查看和管理你的手串设计',
      onClick: () => handleNavigate('/pages/my-designs/index'),
    },
    {
      icon: '📦',
      label: '我的订单',
      desc: '查看订单状态',
      onClick: () => handleNavigate('/pages/orders/index'),
    },
    {
      icon: '📍',
      label: '地址管理',
      desc: '管理收货地址',
      onClick: () => handleNavigate('/pages/address/index'),
    },
    {
      icon: '🎫',
      label: '我的优惠券',
      desc: '查看可用优惠券',
      onClick: () => handleNavigate('/pages/coupon/index'),
    },
    {
      icon: '✅',
      label: '我的任务',
      desc: '完成任务赚积分',
      onClick: () => Taro.showToast({ title: '功能即将上线', icon: 'none' }),
    },
    {
      icon: '👥',
      label: '我的好友',
      desc: '查看好友动态',
      onClick: () => Taro.showToast({ title: '功能即将上线', icon: 'none' }),
    },
    {
      icon: '🎁',
      label: '邀请好友',
      desc: '邀请好友赢好礼',
      onClick: () => Taro.showToast({ title: '功能即将上线', icon: 'none' }),
    },
    {
      icon: '💬',
      label: '联系客服',
      desc: '添加客服珠珠',
      onClick: () => Taro.showToast({ title: '请添加微信客服珠珠', icon: 'none' }),
    },
  ]

  return (
    <View className='profile-page'>
      <ScrollView className='profile-page__scroll' scrollY>
        {/* Header */}
        <View className='profile-page__header'>
          {user ? (
            <View className='profile-page__user-info'>
              <View className='profile-page__avatar-wrap'>
                {user.avatar_url ? (
                  <Image
                    className='profile-page__avatar'
                    src={user.avatar_url}
                    mode='aspectFill'
                  />
                ) : (
                  <View className='profile-page__avatar-placeholder'>
                    <Text className='profile-page__avatar-text'>
                      {(user.nickname || '用')[0]}
                    </Text>
                  </View>
                )}
              </View>
              <View className='profile-page__user-detail'>
                <Text className='profile-page__nickname'>
                  {user.nickname || '珠了个珠用户'}
                </Text>
                <Text className='profile-page__user-id'>ID: {user.id}</Text>
              </View>
            </View>
          ) : (
            <View className='profile-page__not-login'>
              <View className='profile-page__avatar-placeholder profile-page__avatar-placeholder--guest'>
                <Text className='profile-page__avatar-text'>珠</Text>
              </View>
              <View className='profile-page__user-detail'>
                <Text className='profile-page__nickname'>点击登录</Text>
                <Text className='profile-page__login-hint'>登录后享受完整功能</Text>
              </View>
              <View className='profile-page__login-btn' onClick={handleLogin}>
                <Text className='profile-page__login-btn-text'>登录</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu */}
        <View className='profile-page__menu'>
          {menuItems.map((item, i) => (
            <View
              key={i}
              className='profile-page__menu-item'
              onClick={item.onClick}
            >
              <View className='profile-page__menu-icon-wrap'>
                <Text className='profile-page__menu-icon'>{item.icon}</Text>
              </View>
              <View className='profile-page__menu-content'>
                <Text className='profile-page__menu-label'>{item.label}</Text>
                {item.desc && (
                  <Text className='profile-page__menu-desc'>{item.desc}</Text>
                )}
              </View>
              {item.badge !== undefined && item.badge > 0 && (
                <View className='profile-page__badge'>
                  <Text className='profile-page__badge-text'>{item.badge}</Text>
                </View>
              )}
              <Text className='profile-page__menu-arrow'>›</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        {user && (
          <View className='profile-page__logout-wrap'>
            <View
              className='profile-page__logout-btn'
              onClick={() => {
                Taro.showModal({
                  title: '退出登录',
                  content: '确定要退出登录吗？',
                  success(res) {
                    if (res.confirm) logout()
                  },
                })
              }}
            >
              <Text className='profile-page__logout-text'>退出登录</Text>
            </View>
          </View>
        )}

        <View style={{ height: '32rpx' }} />
      </ScrollView>
    </View>
  )
}
