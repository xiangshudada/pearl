import { useEffect, useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getCategories } from '@/api/categories'
import type { Material } from '@/api/materials'

const WUXING_OPTIONS = [
  { value: '金', label: '金' },
  { value: '木', label: '木' },
  { value: '水', label: '水' },
  { value: '火', label: '火' },
  { value: '土', label: '土' },
]

interface MaterialFormProps {
  form: ReturnType<typeof Form.useForm>[0]
  initialValues?: Partial<Material>
}

export default function MaterialForm({ form, initialValues }: MaterialFormProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialValues?.image_url || '')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // 只展示子分类（有 parent_id 的）
  const subCategories =
    categories?.filter((c) => c.parent_id !== null) ?? []

  // 按父分类分组
  const groupedCategories: { label: string; options: { value: number; label: string }[] }[] = []
  const parentCategories = categories?.filter((c) => c.parent_id === null) ?? []
  for (const parent of parentCategories) {
    const children = subCategories.filter((c) => c.parent_id === parent.id)
    if (children.length > 0) {
      groupedCategories.push({
        label: parent.name,
        options: children.map((c) => ({ value: c.id, label: c.name })),
      })
    }
  }

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
      setImageUrl(initialValues.image_url || '')
    } else {
      form.resetFields()
      setImageUrl('')
    }
  }, [form, initialValues])

  return (
    <Form form={form} layout="vertical" initialValues={{ is_active: true, stock: 0, sort_order: 0 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="category_id"
            label="所属分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择子分类" options={groupedCategories} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="name"
            label="材料名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如：巴西紫水晶" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="size_mm"
            label="尺寸 (mm)"
            rules={[{ required: true, message: '请输入尺寸' }]}
          >
            <InputNumber
              min={0.1}
              step={0.5}
              precision={1}
              placeholder="如：8.0"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="price"
            label="单颗价格 (元)"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              prefix="¥"
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="wuxing" label="五行属性">
            <Select placeholder="选择五行（可选）" allowClear options={WUXING_OPTIONS} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="image_url"
        label={
          <span>
            图片 URL
            {imageUrl && (
              <img
                src={imageUrl}
                alt="预览"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginLeft: 8,
                  verticalAlign: 'middle',
                  border: '2px solid #f0f0f0',
                }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </span>
        }
        rules={[{ required: true, message: '请输入图片链接' }]}
      >
        <Input
          placeholder="https://..."
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="stock" label="库存数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="越小越靠前"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="is_active" label="是否上架" valuePropName="checked">
            <Switch checkedChildren="上架" unCheckedChildren="下架" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}
