import React, { useEffect, useState } from 'react';
import { Table, Tag, Rate, Switch, Typography, Avatar, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../services/api';
import { Provider } from '@shared/types';

const { Title } = Typography;

export default function ProvidersPage(): React.JSX.Element {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async (): Promise<void> => {
      try {
        const response = await apiClient.get<{ data: { items: Provider[] } }>('/providers?limit=50');
        setProviders(response.data.data.items);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProviders();
  }, []);

  const toggleVerified = async (providerId: string, isVerified: boolean): Promise<void> => {
    try {
      await apiClient.patch(`/providers/${providerId}/verify`, { isVerified });
      setProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, isVerified } : p)));
      void message.success('Statut de vérification mis à jour');
    } catch {
      void message.error('Erreur lors de la mise à jour');
    }
  };

  const columns: ColumnsType<Provider> = [
    {
      title: 'Prestataire',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{record.firstName} {record.lastName}</span>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Note',
      dataIndex: 'rating',
      render: (rating: number) => <Rate disabled defaultValue={rating} allowHalf style={{ fontSize: 14 }} />,
    },
    {
      title: 'Avis',
      dataIndex: 'reviewCount',
      render: (count: number) => `${count} avis`,
    },
    {
      title: 'Prix/h (MAD)',
      dataIndex: 'pricePerHour',
      render: (price: number) => `${Number(price).toFixed(2)}`,
    },
    {
      title: 'Vérifié',
      dataIndex: 'isVerified',
      render: (isVerified: boolean, record) => (
        <Switch
          checked={isVerified}
          onChange={(v) => void toggleVerified(record.id, v)}
          checkedChildren="Oui"
          unCheckedChildren="Non"
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Prestataires</Title>
      <Table columns={columns} dataSource={providers} rowKey="id" loading={isLoading} />
    </div>
  );
}
