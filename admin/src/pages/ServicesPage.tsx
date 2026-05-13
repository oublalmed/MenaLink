import React, { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Select, Switch, Typography, Space, message, Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../services/api';
import { Service, ServiceType } from '@shared/types';

const { Title } = Typography;

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  STANDARD: 'Standard',
  DEEP_CLEAN: 'Nettoyage profond',
  MOVE_IN_OUT: 'Entrée/Sortie',
  OFFICE: 'Bureau',
  POST_CONSTRUCTION: 'Post-construction',
};

export default function ServicesPage(): React.JSX.Element {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<Service>();

  const fetchServices = async (): Promise<void> => {
    try {
      const response = await apiClient.get<{ data: Service[] }>('/services');
      setServices(response.data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchServices(); }, []);

  const handleSubmit = async (values: Service): Promise<void> => {
    try {
      await apiClient.post('/services', values);
      void message.success('Service créé');
      setModalOpen(false);
      form.resetFields();
      void fetchServices();
    } catch (err) {
      void message.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const columns: ColumnsType<Service> = [
    { title: 'Nom', dataIndex: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: ServiceType) => <Tag>{SERVICE_TYPE_LABELS[type]}</Tag>,
    },
    {
      title: 'Prix de base (MAD)',
      dataIndex: 'basePrice',
      render: (p: number) => `${Number(p).toFixed(2)}`,
    },
    {
      title: 'Durée (h)',
      dataIndex: 'durationHours',
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      render: (v: boolean) => <Switch checked={v} disabled />,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Services</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Nouveau service
        </Button>
      </Space>

      <Table columns={columns} dataSource={services} rowKey="id" loading={isLoading} />

      <Modal
        title="Nouveau service"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" onFinish={(v) => void handleSubmit(v as Service)}>
          <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={Object.values(ServiceType).map((v) => ({ value: v, label: SERVICE_TYPE_LABELS[v] }))} />
          </Form.Item>
          <Form.Item name="basePrice" label="Prix de base (MAD)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationHours" label="Durée (heures)" rules={[{ required: true }]}>
            <InputNumber min={0.5} max={12} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
