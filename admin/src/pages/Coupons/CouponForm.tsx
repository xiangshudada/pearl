import { useEffect } from 'react'
import { Form, Input, InputNumber, Select } from 'antd'
import type { CouponTemplate } from '@/api/coupons'

const TYPE_OPTIONS = [
  { value: 'fixed', label: '满减券（填减免金额，如 10 表示减10元）' },
  { value: 'percent', label: '折扣券（填折扣率，如 0.88 表示88折）' },
  { value: 'free_shipping', label: '免邮券（填 0 即可）' },
]

interface CouponFormProps {
  form: ReturnType<typeof Form.useForm>[0]
  initialValues?: Partial<CouponTemplate>
}

export default function CouponForm({ form, initialValues }: CouponFormProps) {
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
      form.setFieldsValue({ expired_days: 30, type: 'fixed' })
    }
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ expired_days: 30, type: 'fixed' }}
      style={{ marginTop: 8 }}
    >
      <Form.Item
        name="name"
        label="券名称"
        rules={[{ required: true, message: '请输入券名称' }]}
      >
        <Input placeholder="如：新人立减10元" />
      </Form.Item>

      <Form.Item
        name="type"
        label="优惠类型"
        rules={[{ required: true, message: '请选择类型' }]}
      >
        <Select options={TYPE_OPTIONS} />
      </Form.Item>

      <Form.Item
        name="discount"
        label="折扣值"
        rules={[{ required: true, message: '请输入折扣值' }]}
        extra="满减券填减免金额（如 10），折扣券填折扣率（如 0.88），免邮券填 0"
      >
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          placeholder="0.00"
        />
      </Form.Item>

      <Form.Item
        name="min_amount"
        label="最低使用金额（元）"
        extra="留空表示无门槛"
      >
        <InputNumber
          min={0}
          precision={2}
          prefix="¥"
          style={{ width: '100%' }}
          placeholder="留空=无门槛"
        />
      </Form.Item>

      <Form.Item
        name="total_count"
        label="总发放数量"
        extra="留空表示不限量"
      >
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          placeholder="留空=不限量"
        />
      </Form.Item>

      <Form.Item
        name="expired_days"
        label="有效天数"
        rules={[{ required: true, message: '请输入有效天数' }]}
      >
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          addonAfter="天"
        />
      </Form.Item>
    </Form>
  )
}
