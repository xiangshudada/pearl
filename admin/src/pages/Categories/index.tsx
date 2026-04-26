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
  Input,
  InputNumber,
  Select,
  message,
  Card,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/api/categories'
import type { Category } from '@/api/categories'

const { Title } = Typography

interface FormValues {
  parent_id?: number | null
  name: string
  sort_order: number
}

export default function Categories() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<FormValues>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Category | null>(null)
  const [isAddingChild, setIsAddingChild] = useState<number | null>(null) // parent_id when adding child

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success('分类创建成功')
      setModalOpen(false)
    },
    onError: () => message.error('创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success('分类更新成功')
      setModalOpen(false)
    },
    onError: () => message.error('更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success('分类已删除')
    },
    onError: () => message.error('删除失败，请先删除该分类下的所有材料'),
  })

  const handleOpenCreate = () => {
    setEditingRecord(null)
    setIsAddingChild(null)
    form.resetFields()
    form.setFieldsValue({ sort_order: 0, parent_id: null })
    setModalOpen(true)
  }

  const handleOpenAddChild = (parentId: number) => {
    setEditingRecord(null)
    setIsAddingChild(parentId)
    form.resetFields()
    form.setFieldsValue({ sort_order: 0, parent_id: parentId })
    setModalOpen(true)
  }

  const handleOpenEdit = (record: Category) => {
    setEditingRecord(record)
    setIsAddingChild(null)
    form.setFieldsValue({
      parent_id: record.parent_id,
      name: record.name,
      sort_order: record.sort_order,
    })
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

  // 构建树形数据
  const topLevel = categories?.filter((c) => c.parent_id === null) ?? []
  const treeData = topLevel.map((parent) => ({
    ...parent,
    children: categories?.filter((c) => c.parent_id === parent.id) ?? [],
  }))

  const topLevelOptions =
    topLevel.map((c) => ({ value: c.id, label: c.name })) ?? []

  const columns: ColumnsType<Category> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (name: string, record: Category) => (
        <Space>
          {record.parent_id === null ? (
            <Tag color="purple">{name}</Tag>
          ) : (
            <span style={{ marginLeft: 8 }}>{name}</span>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      width: 100,
      render: (_: unknown, record: Category) =>
        record.parent_id === null ? (
          <Tag color="blue">顶级分类</Tag>
        ) : (
          <Tag color="green">子分类</Tag>
        ),
    },
    {
      title: '排序权重',
      dataIndex: 'sort_order',
      width: 100,
      render: (v: number) => <span style={{ color: '#888' }}>{v}</span>,
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, record: Category) => (
        <Space>
          {record.parent_id === null && (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleOpenAddChild(record.id)}
            >
              添加子分类
            </Button>
          )}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="确认删除该分类？"
            description={
              record.parent_id === null
                ? '删除顶级分类会同时删除其所有子分类'
                : '删除前请确保该分类下无材料'
            }
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const getModalTitle = () => {
    if (editingRecord) return '编辑分类'
    if (isAddingChild !== null) return '添加子分类'
    return '新增顶级分类'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
          分类管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{ background: '#7c3aed', border: 'none' }}
        >
          新增顶级分类
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={treeData}
          loading={isLoading}
          expandable={{
            childrenColumnName: 'children',
            defaultExpandAllRows: true,
          }}
          pagination={false}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingRecord ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ sort_order: 0, parent_id: null }}
          style={{ marginTop: 16 }}
        >
          {isAddingChild !== null || (editingRecord && editingRecord.parent_id !== null) ? (
            <Form.Item name="parent_id" label="父分类">
              <Select options={topLevelOptions} disabled={isAddingChild !== null} />
            </Form.Item>
          ) : null}

          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="如：白水晶" />
          </Form.Item>

          <Form.Item name="sort_order" label="排序权重（越小越靠前）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
