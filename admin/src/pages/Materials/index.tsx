import { useState } from 'react'
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Switch,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Row,
  Col,
  Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '@/api/materials'
import type { Material } from '@/api/materials'
import { getCategories } from '@/api/categories'
import MaterialForm from './MaterialForm'

const { Title } = Typography

const WUXING_COLORS: Record<string, string> = {
  金: 'gold',
  木: 'green',
  水: 'blue',
  火: 'red',
  土: 'orange',
}

export default function Materials() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Material | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['materials', { page, per_page: perPage, ...filters }],
    queryFn: () => getMaterials({ page, per_page: perPage, ...filters }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const subCategories = categories?.filter((c) => c.parent_id !== null) ?? []

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      message.success('材料创建成功')
      setModalOpen(false)
    },
    onError: () => message.error('创建失败，请重试'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Material> }) =>
      updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      message.success('材料更新成功')
      setModalOpen(false)
    },
    onError: () => message.error('更新失败，请重试'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      message.success('材料已删除')
    },
    onError: () => message.error('删除失败，请重试'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateMaterial(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: () => message.error('操作失败'),
  })

  const handleOpenCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEdit = (record: Material) => {
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
      // 表单验证失败
    }
  }

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

  const columns: ColumnsType<Material> = [
    {
      title: '图片',
      dataIndex: 'image_url',
      width: 60,
      render: (url: string) =>
        url ? (
          <img
            src={url}
            alt="预览"
            className="bead-preview"
            onError={(e) => {
              const parent = (e.target as HTMLImageElement).parentElement!
              parent.innerHTML =
                '<div class="bead-color-block" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#c8a415);border:2px solid #f0f0f0;"></div>'
            }}
          />
        ) : (
          <div className="bead-color-block" />
        ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      render: (name?: string) => name ? <Tag>{name}</Tag> : '-',
    },
    {
      title: '尺寸',
      dataIndex: 'size_mm',
      width: 80,
      render: (v: number) => `${v}mm`,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 90,
      render: (v: number) => (
        <span style={{ color: '#7c3aed', fontWeight: 600 }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '五行',
      dataIndex: 'wuxing',
      width: 70,
      render: (v: string | null) =>
        v ? <Tag color={WUXING_COLORS[v]}>{v}</Tag> : '-',
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 70,
      render: (v: number) => (
        <span style={{ color: v === 0 ? '#ef4444' : '#10b981' }}>{v}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 90,
      render: (v: boolean, record: Material) => (
        <Switch
          size="small"
          checked={v}
          checkedChildren="上架"
          unCheckedChildren="下架"
          loading={toggleActiveMutation.isPending}
          onChange={(checked) =>
            toggleActiveMutation.mutate({ id: record.id, is_active: checked })
          }
        />
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: Material) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该材料？"
            description="删除后无法恢复"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
          材料管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{ background: '#7c3aed', border: 'none' }}
        >
          新增材料
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #f0f0f0' }}
        styles={{ body: { padding: '16px 20px 4px' } }}
      >
        <Form form={searchForm} layout="inline">
          <Row gutter={[12, 8]} style={{ width: '100%' }}>
            <Col flex="200px">
              <Form.Item name="name" style={{ marginBottom: 12 }}>
                <Input placeholder="搜索材料名称" prefix={<SearchOutlined />} allowClear />
              </Form.Item>
            </Col>
            <Col flex="160px">
              <Form.Item name="category_id" style={{ marginBottom: 12 }}>
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={subCategories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            </Col>
            <Col flex="140px">
              <Form.Item name="wuxing" style={{ marginBottom: 12 }}>
                <Select
                  placeholder="五行"
                  allowClear
                  options={['金', '木', '水', '火', '土'].map((v) => ({ value: v, label: v }))}
                />
              </Form.Item>
            </Col>
            <Col flex="140px">
              <Form.Item name="is_active" style={{ marginBottom: 12 }}>
                <Select
                  placeholder="上架状态"
                  allowClear
                  options={[
                    { value: true, label: '上架' },
                    { value: false, label: '下架' },
                  ]}
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

      <Modal
        title={editingRecord ? '编辑材料' : '新增材料'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingRecord ? '保存' : '创建'}
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <MaterialForm form={form} initialValues={editingRecord ?? undefined} />
      </Modal>
    </div>
  )
}
