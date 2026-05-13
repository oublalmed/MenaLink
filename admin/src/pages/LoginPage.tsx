import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAdminAuth } from '../store/adminAuthStore';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage(): React.JSX.Element {
  const { login, isLoading } = useAdminAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (values: LoginForm): Promise<void> => {
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F0F4F8' }}>
      <Card style={{ width: 400, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#2980B9', margin: 0 }}>MenaLink</Title>
          <Text type="secondary">Panneau d'administration</Text>
        </div>

        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={(v) => void handleSubmit(v as LoginForm)}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email invalide' }]}>
            <Input prefix={<UserOutlined />} placeholder="Adresse e-mail" size="large" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Mot de passe requis' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mot de passe" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
            Se connecter
          </Button>
        </Form>
      </Card>
    </div>
  );
}
