import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd'
import {
  ExperimentOutlined,
  BgColorsOutlined,
  GiftOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getMaterials } from '@/api/materials'
import { getDesigns } from '@/api/designs'
import { getOrders } from '@/api/orders'
import { getCouponTemplates } from '@/api/coupons'

const { Title } = Typography

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: materialsData, isLoading: loadingMaterials } = useQuery({
    queryKey: ['materials', { per_page: 1 }],
    queryFn: () => getMaterials({ per_page: 1 }),
  })

  const { data: designsData, isLoading: loadingDesigns } = useQuery({
    queryKey: ['designs', { per_page: 1 }],
    queryFn: () => getDesigns({ per_page: 1 }),
  })

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', { per_page: 1 }],
    queryFn: () => getOrders({ per_page: 1 }),
  })

  const { data: couponsData, isLoading: loadingCoupons } = useQuery({
    queryKey: ['coupon-templates'],
    queryFn: getCouponTemplates,
  })

  const statCards = [
    {
      title: '材料总数',
      value: materialsData?.total ?? 0,
      icon: <ExperimentOutlined style={{ fontSize: 32, color: '#7c3aed' }} />,
      color: '#f5f0ff',
      loading: loadingMaterials,
      suffix: '种',
      path: '/materials',
    },
    {
      title: '设计总数',
      value: designsData?.total ?? 0,
      icon: <BgColorsOutlined style={{ fontSize: 32, color: '#0ea5e9' }} />,
      color: '#f0f9ff',
      loading: loadingDesigns,
      suffix: '款',
      path: '/designs',
    },
    {
      title: '优惠券模板',
      value: couponsData?.length ?? 0,
      icon: <GiftOutlined style={{ fontSize: 32, color: '#10b981' }} />,
      color: '#f0fdf4',
      loading: loadingCoupons,
      suffix: '张',
      path: '/coupons',
    },
    {
      title: '订单总数',
      value: ordersData?.total ?? 0,
      icon: <ShoppingOutlined style={{ fontSize: 32, color: '#f59e0b' }} />,
      color: '#fffbeb',
      loading: loadingOrders,
      suffix: '单',
      path: '/orders',
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#1a1a2e' }}>
        数据概览
      </Title>

      <Row gutter={[24, 24]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} xl={6} key={card.title}>
            <Card
              hoverable
              onClick={() => navigate(card.path)}
              style={{
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <Spin spinning={card.loading}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{card.title}</div>
                    <Statistic
                      value={card.value}
                      suffix={card.suffix}
                      valueStyle={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e' }}
                    />
                  </div>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="快速导航"
            style={{
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Row gutter={[16, 16]}>
              {[
                { label: '添加材料', path: '/materials', color: '#7c3aed', emoji: '🔮' },
                { label: '管理分类', path: '/categories', color: '#0ea5e9', emoji: '🏷️' },
                { label: '审核设计', path: '/designs', color: '#10b981', emoji: '🎨' },
                { label: '发放优惠券', path: '/coupons', color: '#f59e0b', emoji: '🎟️' },
                { label: '查看订单', path: '/orders', color: '#ef4444', emoji: '📦' },
              ].map((item) => (
                <Col xs={12} sm={8} md={6} lg={4} key={item.label}>
                  <div
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '20px 16px',
                      borderRadius: 12,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}30`,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(-2px)'
                      el.style.boxShadow = `0 4px 12px ${item.color}30`
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
                    <div style={{ color: item.color, fontWeight: 600, fontSize: 13 }}>
                      {item.label}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
