import { useState } from 'react'
import {
  Table,
  Typography,
  Tag,
  Switch,
  Card,
  Form,
  Select,
  Button,
  Space,
  Row,
  Col,
  message,
  Avatar,
  Tooltip,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { getDesigns, togglePublish } from '@/api/designs'
import type { Design } from '@/api/designs'
import dayjs from 'dayjs'

const { Title } = Typography

export default function Designs() {
  const queryClient = useQueryClient()
  const [searchForm] = Form.useForm()
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  // 后端仅支持 is_published 过滤
  const [isPublishedFilter, setIsPublishedFilter] = useState<number | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['designs', { page, per_page: perPage, is_published: isPublishedFilter }],
    queryFn: () =>
      getDesigns({
        page,
        per_page: perPage,
        ...(isPublishedFilter !== undefined ? { is_published: isPublishedFilter } : {}),
      }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => togglePublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] })
      message.success('发布状态已切换')
    },
    onError: () => message.error('操作失败，请重试'),
  })

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    // is_published: true→1, false→0, undefined→不传
    if (values.is_published === true) {
      setIsPublishedFilter(1)
    } else if (values.is_published === false) {
      setIsPublishedFilter(0)
    } else {
      setIsPublishedFilter(undefined)
    }
    setPage(1)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setIsPublishedFilter(undefined)
    setPage(1)
  }

  const columns: ColumnsType<Design> = [
    {
      title: '预览',
      dataIndex: 'preview_url',
      width: 60,
      render: (url: string | null) =>
        url ? (
          <Avatar src={url} shape="circle" size={40} style={{ border: '2px solid #f0f0f0' }} />
        ) : (
          <Avatar
            shape="circle"
            size={40}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', fontSize: 18 }}
          >
            🔮
          </Avatar>
        ),
    },
    {
      title: '设计名称',
      dataIndex: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '作者',
      dataIndex: 'user_nickname',
      render: (nickname?: string) =>
        nickname ? nickname : <span style={{ color: '#bbb' }}>匿名</span>,
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      width: 100,
      render: (v: number) => (
        <span style={{ color: '#7c3aed', fontWeight: 600 }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '发布状态',
      dataIndex: 'is_published',
      width: 100,
      render: (v: boolean) =>
        v ? <Tag color="green">已发布</Tag> : <Tag color="default">未发布</Tag>,
    },
    {
      title: '完成状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) =>
        v === 'completed' ? <Tag color="blue">已完成</Tag> : <Tag color="orange">草稿</Tag>,
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      width: 90,
      render: (v: number) => <span style={{ color: '#10b981' }}>{v}</span>,
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      width: 80,
      render: (v: number) => v,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '发布控制',
      width: 110,
      render: (_: unknown, record: Design) => (
        <Tooltip title={record.is_published ? '点击下架' : '点击发布'}>
          <Switch
            size="small"
            checked={!!record.is_published}
            checkedChildren="已发布"
            unCheckedChildren="下架"
            loading={toggleMutation.isPending}
            onChange={() => toggleMutation.mutate(record.id)}
          />
        </Tooltip>
      ),
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
          设计管理
        </Title>
      </div>

      {/* 搜索栏 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        styles={{ body: { padding: '16px 20px 4px' } }}
      >
        <Form form={searchForm} layout="inline">
          <Row gutter={[12, 8]} style={{ width: '100%' }}>
            <Col flex="180px">
              <Form.Item name="is_published" style={{ marginBottom: 12 }}>
                <Select
                  placeholder="发布状态"
                  allowClear
                  options={[
                    { value: true, label: '已发布' },
                    { value: false, label: '未发布' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Form.Item style={{ marginBottom: 12 }}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    筛选
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
