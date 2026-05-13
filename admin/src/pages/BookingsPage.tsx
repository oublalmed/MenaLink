import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Select, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';
import { Booking, BookingStatus } from '@shared/types';

const { Title } = Typography;

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
  DISPUTED: 'volcano',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

export default function BookingsPage(): React.JSX.Element {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });

  const fetchBookings = async (page = 1): Promise<void> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const response = await apiClient.get<{
        data: { items: Booking[]; total: number; page: number };
      }>(`/bookings?${params.toString()}`);

      setBookings(response.data.data.items);
      setPagination((prev) => ({ ...prev, total: response.data.data.total, page }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBookings();
  }, [statusFilter]);

  const columns: ColumnsType<Booking> = [
    {
      title: 'Client',
      render: (_, record) =>
        record.client ? `${record.client.firstName} ${record.client.lastName}` : '—',
    },
    {
      title: 'Service',
      render: (_, record) => record.service?.name ?? '—',
    },
    {
      title: 'Date prévue',
      dataIndex: 'scheduledAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Montant',
      dataIndex: 'totalPrice',
      render: (price: number) => `${Number(price).toFixed(2)} MAD`,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      render: (status: BookingStatus) => (
        <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Réservations</Title>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={[
            { value: 'ALL', label: 'Tous les statuts' },
            ...Object.values(BookingStatus).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: pagination.page,
          total: pagination.total,
          pageSize: pagination.limit,
          onChange: (page) => void fetchBookings(page),
        }}
      />
    </div>
  );
}
