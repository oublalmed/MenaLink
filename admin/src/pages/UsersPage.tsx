import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Avatar, Switch, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';
import { User } from '@shared/types';

const { Title } = Typography;

export default function UsersPage(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      try {
        const response = await apiClient.get<{ data: { items: User[] } }>('/users?role=CLIENT&limit=50');
        setUsers(response.data.data.items);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUsers();
  }, []);

  const toggleStatus = async (userId: string, isActive: boolean): Promise<void> => {
    try {
      await apiClient.patch(`/users/${userId}/status`, { isActive });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive } : u)));
      void message.success('Statut mis à jour');
    } catch {
      void message.error('Erreur lors de la mise à jour');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Utilisateur',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{record.firstName} {record.lastName}</span>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Téléphone', dataIndex: 'phone' },
    {
      title: 'Inscrit le',
      dataIndex: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(v) => void toggleStatus(record.id, v)}
          checkedChildren="Oui"
          unCheckedChildren="Non"
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Clients</Title>
      <Table columns={columns} dataSource={users} rowKey="id" loading={isLoading} />
    </div>
  );
}
