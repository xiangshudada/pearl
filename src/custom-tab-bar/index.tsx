import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.less'

const TAB_LIST = [
  { pagePath: '/pages/index/index', text: '广场', icon: '🏠' },
  { pagePath: '/pages/designer/index', text: '设计', icon: '✏️' },
  { pagePath: '/pages/profile/index', text: '我的', icon: '👤' },
]

interface TabBarState {
  selected: number
}

export default class CustomTabBar extends Component<{}, TabBarState> {
  state: TabBarState = {
    selected: 0
  }

  setSelected(index: number) {
    this.setState({ selected: index })
  }

  switchTab(index: number, path: string) {
    this.setState({ selected: index })
    Taro.switchTab({ url: path })
  }

  render() {
    const { selected } = this.state
    return (
      <View className='tab-bar'>
        {TAB_LIST.map((item, index) => (
          <View
            key={item.pagePath}
            className={`tab-bar-item ${selected === index ? 'tab-bar-item--active' : ''}`}
            onClick={() => this.switchTab(index, item.pagePath)}
          >
            <Text className='tab-bar-icon'>{item.icon}</Text>
            <Text className='tab-bar-text'>{item.text}</Text>
          </View>
        ))}
      </View>
    )
  }
}
