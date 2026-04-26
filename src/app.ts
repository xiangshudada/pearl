import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './app.less'

declare const CLOUD_ENV_ID: string

function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize WeChat Cloud if env ID is configured
    if (CLOUD_ENV_ID && CLOUD_ENV_ID !== '') {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true,
      })
    }

    // Initialize user store (check existing token)
    import('./store/user').then(({ useUserStore }) => {
      const store = useUserStore.getState()
      store.init()
    })
  }, [])

  return children
}

export default App
