import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, Typography, message, Spin, Divider } from 'antd';
import apiClient from '../services/api';

const { Title } = Typography;

interface AppSettings {
  commissionRate: number;
  minWithdrawalAmount: number;
  maxBookingDurationHours: number;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  youcanPayApiKey: string;
  supportEmail: string;
  supportPhone: string;
}

export default function SettingsPage(): React.JSX.Element {
  const [form]      = Form.useForm<AppSettings>();
  const [isLoading, setLoading]   = useState(true);
  const [isSaving, setSaving]     = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const res = await apiClient.get<{ data: AppSettings }>('/admin/settings');
        form.setFieldsValue(res.data.data);
      } catch {
        // use defaults if endpoint not ready
        form.setFieldsValue({
          commissionRate: 15, minWithdrawalAmount: 100,
          maxBookingDurationHours: 8, maintenanceMode: false,
          allowNewRegistrations: true, supportEmail: 'support@menalink.ma',
          supportPhone: '+212522000000',
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [form]);

  const handleSave = async (values: AppSettings): Promise<void> => {
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', values);
      void message.success('Paramètres enregistrés');
    } catch {
      void message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div style={{ maxWidth: 720 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Paramètres de l'application</Title>

      <Form form={form} layout="vertical" onFinish={v => void handleSave(v as AppSettings)}>
        <Card title="Financier" style={{ marginBottom: 16 }}>
          <Form.Item name="commissionRate" label="Taux de commission (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={50} step={0.5} style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item name="minWithdrawalAmount" label="Retrait minimum (MAD)" rules={[{ required: true }]}>
            <InputNumber min={50} style={{ width: '100%' }} addonAfter="MAD" />
          </Form.Item>
          <Form.Item name="maxBookingDurationHours" label="Durée max réservation (heures)" rules={[{ required: true }]}>
            <InputNumber min={1} max={24} style={{ width: '100%' }} addonAfter="h" />
          </Form.Item>
        </Card>

        <Card title="Application" style={{ marginBottom: 16 }}>
          <Form.Item name="maintenanceMode" label="Mode maintenance" valuePropName="checked">
            <Switch checkedChildren="Activé" unCheckedChildren="Désactivé" />
          </Form.Item>
          <Form.Item name="allowNewRegistrations" label="Autoriser les nouvelles inscriptions" valuePropName="checked">
            <Switch checkedChildren="Oui" unCheckedChildren="Non" />
          </Form.Item>
          <Form.Item name="youcanPayApiKey" label="Clé API YouCan Pay">
            <Input.Password />
          </Form.Item>
        </Card>

        <Card title="Support" style={{ marginBottom: 24 }}>
          <Form.Item name="supportEmail" label="Email support" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supportPhone" label="Téléphone support">
            <Input />
          </Form.Item>
        </Card>

        <Button type="primary" htmlType="submit" loading={isSaving} size="large">
          Enregistrer les paramètres
        </Button>
      </Form>
    </div>
  );
}
