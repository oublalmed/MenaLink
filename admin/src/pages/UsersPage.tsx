import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Avatar, Switch, message, Input, Space } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  role: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green', PENDING: 'orange', SUSPENDED: 'red', BANNED: 'volcano',
};

export default function UsersPage(): React.JSX.Element {
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [search, setSearch]       = useState('');
  const [pagination, setPaging]   = useState({ page: 1, total: 0, limit: 20 });

  const fetchUsers = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', role: 'CLIENT' });
      if (search) params.set('search', search);
      const res = await apiClient.get<{ data: { items: AdminUser[]; total: number } }>(
        `/admin/users?${params.toString()}`
      );
      setUsers(res.data.data.items);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchUsers(1); }, [search]);

  const toggleStatus = async (userId: string, currentStatus: string): Promise<void> => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as AdminUser['status'] } : u));
      void message.success(`Utilisateur ${newStatus === 'ACTIVE' ? 'activé' : 'suspendu'}`);
    } catch {
      void message.error('Erreur lors de la mise à jour');
    }
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'Utilisateur',
      render: (_, r) => (
        <Space>
          <Avatar src={r.avatarUrl} icon={<UserOutlined />} />
          <span>{r.firstName} {r.lastName}</span>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    { title: 'Téléphone', dataIndex: 'phone' },
    { title: 'Inscrit le', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    {
      title: 'Actif',
      render: (_, r) => (
        <Switch
          checked={r.status === 'ACTIVE'}
          onChange={() => void toggleStatus(r.id, r.status)}
          checkedChildren="Oui"
          unCheckedChildren="Non"
        />
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Clients</Title>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
      </Space>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: p => void fetchUsers(p) }}
        size="small"
      />
    </div>
  );
}
