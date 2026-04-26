import { useState } from 'react'
import {
  Table,
  Typography,
  Tag,
  Card,
  Form,
  Select,
  Button,
  Space,
  Row,
  Col,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { getOrders } from '@/api/orders'
import type { Order, OrderStatus } from '@/api/orders'
import dayjs from 'dayjs'

const { Title } = Typography

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending_payment: { label: '待付款', color: 'orange' },
  paid: { label: '已付款', color: 'blue' },
  shipped: { label: '已发货', color: 'cyan' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
}

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))

export default function Orders() {
  const [searchForm] = Form.useForm()
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, per_page: perPage, ...filters }],
    queryFn: () => getOrders({ page, per_page: perPage, ...filters }),
  })

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const cleaned: Record<string, unknown> = {}
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) cleaned[k] = v
    })
    setFilters(cleaned)
    setPage(1)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPage(1)
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单ID',
      dataIndex: 'id',
      width: 80,
      render: (v: number) => <span style={{ color: '#888', fontSize: 12 }}>#{v}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user_nickname',
      render: (name?: string) => name || <span style={{ color: '#bbb' }}>未知用户</span>,
    },
    {
      title: '设计',
      dataIndex: 'design_name',
      render: (name?: string) => name || <span style={{ color: '#bbb' }}>-</span>,
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      width: 110,
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '优惠',
      dataIndex: 'discount_amount',
      width: 90,
      render: (v: number) =>
        Number(v) > 0 ? (
          <span style={{ color: '#ef4444' }}>-¥{Number(v).toFixed(2)}</span>
        ) : (
          <span style={{ color: '#bbb' }}>-</span>
        ),
    },
    {
      title: '实付金额',
      dataIndex: 'pay_amount',
      width: 110,
      render: (v: number) => (
        <span style={{ color: '#7c3aed', fontWeight: 600 }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: OrderStatus) => {
        const config = STATUS_CONFIG[status]
        return <Tag color={config?.color}>{config?.label ?? status}</Tag>
      },
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
          订单管理
        </Title>
        <Tag color="orange" style={{ padding: '4px 10px', fontSize: 13 }}>
          本期只读，暂不提供操作
        </Tag>
      </div>

      {/* 搜索栏 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        styles={{ body: { padding: '16px 20px 4px' } }}
      >
        <Form form={searchForm} layout="inline">
          <Row gutter={[12, 8]} style={{ width: '100%' }}>
            <Col flex="200px">
              <Form.Item name="status" style={{ marginBottom: 12 }}>
                <Select
                  placeholder="订单状态"
                  allowClear
                  options={STATUS_OPTIONS}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Form.Item style={{ marginBottom: 12 }}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    搜索
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: perPage,
            total: data?.total ?? 0,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>
    </div>
  )
}
