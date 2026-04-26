import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Space, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  TagsOutlined,
  BgColorsOutlined,
  GiftOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '数据概览',
  },
  {
    key: '/materials',
    icon: <ExperimentOutlined />,
    label: '材料管理',
  },
  {
    key: '/categories',
    icon: <TagsOutlined />,
    label: '分类管理',
  },
  {
    key: '/designs',
    icon: <BgColorsOutlined />,
    label: '设计管理',
  },
  {
    key: '/coupons',
    icon: <GiftOutlined />,
    label: '优惠券管理',
  },
  {
    key: '/orders',
    icon: <ShoppingOutlined />,
    label: '订单管理',
  },
]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const dropdownItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#1a1a2e',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
        width={220}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🔮
          </div>
          {!collapsed && (
            <Text
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                marginLeft: 10,
                whiteSpace: 'nowrap',
              }}
            >
              珠了个珠
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />

          <Space>
            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{ background: '#7c3aed' }}
                />
                <Text style={{ fontSize: 14 }}>管理员</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
