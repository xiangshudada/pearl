import { useState } from 'react'
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  Modal,
  Form,
  message,
  Card,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import {
  getCouponTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  distributeToAll,
} from '@/api/coupons'
import type { CouponTemplate } from '@/api/coupons'
import CouponForm from './CouponForm'

const { Title } = Typography

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  fixed: { label: '满减', color: 'gold' },
  percent: { label: '折扣', color: 'blue' },
  free_shipping: { label: '免邮', color: 'green' },
}

export default function Coupons() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)
  const [distributeModal, setDistributeModal] = useState<CouponTemplate | null>(null)
  const [editingRecord, setEditingRecord] = useState<CouponTemplate | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['coupon-templates'],
    queryFn: getCouponTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon-templates'] })
      message.success('优惠券模板创建成功')
      setModalOpen(false)
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CouponTemplate> }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon-templates'] })
      message.success('更新成功')
      setModalOpen(false)
    },
    onError: () => message.error('更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon-templates'] })
      message.success('模板已删除')
    },
    onError: () => message.error('删除失败'),
  })

  const distributeMutation = useMutation({
    mutationFn: (id: number) => distributeToAll(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['coupon-templates'] })
      message.success(`发放成功，共发放给 ${res.distributed_count} 位用户`)
      setDistributeModal(null)
    },
    onError: () => message.error('发放失败'),
  })

  const handleOpenCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEdit = (record: CouponTemplate) => {
    setEditingRecord(record)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        updateMutation.mutate({ id: editingRecord.id, data: values })
      } else {
        createMutation.mutate(values)
      }
    } catch {
      //
    }
  }

  const formatDiscount = (template: CouponTemplate) => {
    if (template.type === 'fixed') return `减 ¥${Number(template.discount).toFixed(2)}`
    if (template.type === 'percent') return `${(Number(template.discount) * 10).toFixed(1)}折`
    return '免邮'
  }

  const columns: ColumnsType<CouponTemplate> = [
    {
      title: '券名称',
      dataIndex: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (t: string) => {
        const info = TYPE_LABELS[t]
        return <Tag color={info?.color}>{info?.label}</Tag>
      },
    },
    {
      title: '优惠',
      width: 100,
      render: (_: unknown, record: CouponTemplate) => (
        <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatDiscount(record)}</span>
      ),
    },
    {
      title: '使用门槛',
      dataIndex: 'min_amount',
      width: 110,
      render: (v: number | null) =>
        v ? `满 ¥${Number(v).toFixed(2)}` : <span style={{ color: '#bbb' }}>无门槛</span>,
    },
    {
      title: '总量',
      dataIndex: 'total_count',
      width: 80,
      render: (v: number | null) =>
        v ? v : <span style={{ color: '#bbb' }}>不限</span>,
    },
    {
      title: '已发放',
      dataIndex: 'issued_count',
      width: 80,
      render: (v: number) => <span style={{ color: '#10b981' }}>{v}</span>,
    },
    {
      title: '有效天数',
      dataIndex: 'expired_days',
      width: 90,
      render: (v: number) => `${v} 天`,
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: CouponTemplate) => (
        <Space size="small">
          <Tooltip title="发放给全部用户">
            <Button
              type="text"
              icon={<SendOutlined />}
              size="small"
              style={{ color: '#10b981' }}
              onClick={() => setDistributeModal(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该券模板？"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
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
          优惠券管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{ background: '#7c3aed', border: 'none' }}
        >
          新增券模板
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={templates ?? []}
          loading={isLoading}
          pagination={false}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑券模板' : '新增券模板'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingRecord ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
      >
        <CouponForm form={form} initialValues={editingRecord ?? undefined} />
      </Modal>

      {/* 发放 Modal */}
      <Modal
        title="发放优惠券"
        open={!!distributeModal}
        onOk={() => distributeModal && distributeMutation.mutate(distributeModal.id)}
        onCancel={() => setDistributeModal(null)}
        confirmLoading={distributeMutation.isPending}
        okText="确认发放"
        cancelText="取消"
      >
        {distributeModal && (
          <div style={{ padding: '16px 0' }}>
            <p>
              确定将券 <strong>「{distributeModal.name}」</strong> 发放给所有用户吗？
            </p>
            <p style={{ color: '#888', fontSize: 13 }}>
              券类型：{TYPE_LABELS[distributeModal.type]?.label} ·{' '}
              {formatDiscount(distributeModal)} · 有效 {distributeModal.expired_days} 天
            </p>
            {distributeModal.total_count && (
              <p style={{ color: '#f59e0b', fontSize: 13 }}>
                注意：该券有总量限制，剩余可发：
                {distributeModal.total_count - distributeModal.issued_count} 张
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
