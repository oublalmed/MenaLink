import React, { useEffect, useState } from 'react';
import { Table, Tag, Rate, Switch, Typography, Avatar, message, Space, Input, Tabs } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface AdminProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  status: string;
  averageRating: number;
  totalReviews: number;
  totalMissions: number;
  isVerified: boolean;
  isAvailable: boolean;
  hourlyRateMin: number;
  hourlyRateMax: number;
  createdAt: string;
}

export default function ProvidersPage(): React.JSX.Element {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [search, setSearch]       = useState('');
  const [activeTab, setTab]       = useState<'all' | 'pending'>('pending');
  const [pagination, setPaging]   = useState({ page: 1, total: 0, limit: 20 });

  const fetchProviders = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/admin/providers/pending' : '/admin/providers';
      const params   = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await apiClient.get<{ data: { items: AdminProvider[]; total: number } }>(
        `${endpoint}?${params.toString()}`
      );
      setProviders(res.data.data.items);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchProviders(1); }, [activeTab, search]);

  const toggleVerify = async (id: string, isVerified: boolean): Promise<void> => {
    try {
      await apiClient.patch(`/admin/providers/${id}/verify`, { isVerified });
      setProviders(prev => prev.map(p => p.id === id ? { ...p, isVerified } : p));
      void message.success(isVerified ? 'Prestataire vérifié' : 'Vérification retirée');
    } catch {
      void message.error('Erreur lors de la mise à jour');
    }
  };

  const columns: ColumnsType<AdminProvider> = [
    {
      title: 'Prestataire',
      render: (_, r) => (
        <Space>
          <Avatar src={r.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div>{r.firstName} {r.lastName}</div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>{r.email}</div>
          </div>
        </Space>
      ),
      width: 220,
    },
    {
      title: 'Note', dataIndex: 'averageRating',
      render: (r: number) => <Rate disabled value={r} allowHalf style={{ fontSize: 12 }} />,
    },
    { title: 'Avis', dataIndex: 'totalReviews', render: (n: number) => `${n} avis` },
    { title: 'Missions', dataIndex: 'totalMissions' },
    { title: 'Tarif', render: (_, r) => `${r.hourlyRateMin}–${r.hourlyRateMax} MAD/h` },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : s === 'PENDING' ? 'orange' : 'red'}>{s}</Tag>,
    },
    {
      title: 'Vérifié', dataIndex: 'isVerified',
      render: (v: boolean, r) => (
        <Switch checked={v} onChange={nv => void toggleVerify(r.id, nv)} checkedChildren="Oui" unCheckedChildren="Non" />
      ),
    },
    { title: 'Inscrit', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YY') },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Prestataires</Title>
        <Input prefix={<SearchOutlined />} placeholder="Rechercher..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ width: 240 }} allowClear />
      </Space>

      <Tabs activeKey={activeTab} onChange={k => setTab(k as 'all' | 'pending')} items={[
        { key: 'pending', label: 'En attente de vérification' },
        { key: 'all', label: 'Tous les prestataires' },
      ]} style={{ marginBottom: 16 }} />

      <Table
        columns={columns} dataSource={providers} rowKey="id" loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: p => void fetchProviders(p) }}
        size="small"
      />
    </div>
  );
}
