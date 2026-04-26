export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/design-detail/index',
    'pages/designer/index',
    'pages/my-designs/index',
    'pages/publish/index',
    'pages/orders/index',
    'pages/profile/index',
    'pages/address/index',
    'pages/coupon/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fef7ff',
    navigationBarTitleText: '珠了个珠',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    custom: true,
    color: '#999',
    selectedColor: '#6750A4',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/index/index', text: '广场' },
      { pagePath: 'pages/designer/index', text: '设计' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
})
