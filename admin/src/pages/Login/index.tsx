import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'

const { Title, Text } = Typography

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [form] = Form.useForm<LoginForm>()

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success('登录成功')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      message.error(error?.response?.data?.detail || '用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      style={{
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        borderRadius: 16,
        border: 'none',
      }}
      styles={{ body: { padding: '40px 40px 32px' } }}
    >
      <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 8,
          }}
        >
          🔮
        </div>
        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
          珠了个珠管理后台
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Pearl Admin Dashboard
        </Text>
      </Space>

      <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#bbb' }} />}
            placeholder="用户名"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bbb' }} />}
            placeholder="密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 44,
              fontSize: 16,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none',
            }}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
