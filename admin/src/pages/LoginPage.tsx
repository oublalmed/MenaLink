import React from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAdminAuth } from '../store/adminAuthStore';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage(): React.JSX.Element {
  const { login, isLoading } = useAdminAuth();
  const [form] = Form.useForm<LoginFormValues>();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.includes('wrong-password') || err.message.includes('invalid-credential')
            ? 'Email ou mot de passe incorrect.'
            : err.message.includes('too-many-requests')
              ? 'Trop de tentatives. Veuillez réessayer plus tard.'
              : err.message.includes('user-not-found')
                ? 'Aucun compte associé à cet email.'
                : 'Une erreur est survenue. Veuillez réessayer.'
          : 'Identifiants incorrects.';
      setError(msg);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#FBF4EC',
        padding: '24px 16px',
      }}
    >
      <Card
        style={{
          width: 440,
          maxWidth: '100%',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          border: 'none',
        }}
        styles={{ body: { padding: '40px 40px 32px' } }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #E8963A 0%, #C4762A 100%)',
              marginBottom: 16,
            }}
          >
            <UserOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <Title
            level={2}
            style={{
              color: '#E8963A',
              margin: 0,
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            MenaLink
          </Title>
          <Text
            style={{
              color: '#7F8C8D',
              fontSize: 14,
              display: 'block',
              marginTop: 4,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Administration
          </Text>
        </div>

        <Divider style={{ margin: '0 0 28px', borderColor: '#ECF0F1' }} />

        {/* Error Alert */}
        {error !== null && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        {/* Login Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => void handleSubmit(v)}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="email"
            label={<Text strong style={{ fontSize: 13 }}>Adresse e-mail</Text>}
            rules={[
              { required: true, message: 'Veuillez saisir votre adresse e-mail.' },
              { type: 'email', message: 'Veuillez saisir une adresse e-mail valide.' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#BDC3C7' }} />}
              placeholder="admin@menalink.com"
              autoComplete="email"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text strong style={{ fontSize: 13 }}>Mot de passe</Text>}
            rules={[
              { required: true, message: 'Veuillez saisir votre mot de passe.' },
              { min: 6, message: 'Le mot de passe doit contenir au moins 6 caractères.' },
            ]}
            style={{ marginBottom: 28 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#BDC3C7' }} />}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            style={{
              height: 48,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              background: 'linear-gradient(135deg, #E8963A 0%, #C4762A 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(41,128,185,0.35)',
            }}
          >
            {isLoading ? 'Connexion en cours…' : 'Connexion'}
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ color: '#95A5A6', fontSize: 12 }}>
            Accès réservé aux administrateurs MenaLink
          </Text>
        </div>
      </Card>

      <Text style={{ color: '#BDC3C7', fontSize: 12, marginTop: 24 }}>
        © {new Date().getFullYear()} MenaLink — Tous droits réservés
      </Text>
    </div>
  );
}
