import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Select, Space, Button, Modal, Descriptions } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface AdminBooking {
  id: string;
  clientName: string;
  providerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalAmount: number;
  commission: number;
  providerAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange', CONFIRMED: 'blue', IN_PROGRESS: 'cyan',
  COMPLETED: 'green', CANCELLED: 'red', DISPUTED: 'volcano',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée', DISPUTED: 'Litige',
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

export default function BookingsPage(): React.JSX.Element {
  const [bookings, setBookings]   = useState<AdminBooking[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [statusFilter, setFilter] = useState('ALL');
  const [pagination, setPaging]   = useState({ page: 1, total: 0, limit: 15 });
  const [selected, setSelected]   = useState<AdminBooking | null>(null);

  const fetchBookings = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await apiClient.get<{ data: { items: AdminBooking[]; total: number } }>(
        `/admin/bookings?${params.toString()}`
      );
      setBookings(res.data.data.items);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchBookings(1); }, [statusFilter]);

  const columns: ColumnsType<AdminBooking> = [
    { title: 'Client', dataIndex: 'clientName', ellipsis: true },
    { title: 'Prestataire', dataIndex: 'providerName', ellipsis: true },
    { title: 'Service', dataIndex: 'serviceType' },
    {
      title: 'Date', dataIndex: 'scheduledDate',
      render: (d: string, r) => `${dayjs(d).format('DD/MM/YY')} ${r.scheduledTime}`,
    },
    { title: 'Durée', dataIndex: 'durationHours', render: (h: number) => `${h}h` },
    { title: 'Montant', dataIndex: 'totalAmount', render: (a: number) => `${a.toFixed(2)} MAD` },
    {
      title: 'Paiement', dataIndex: 'paymentStatus',
      render: (s: string) => <Tag color={s === 'PAID' ? 'green' : s === 'REFUNDED' ? 'orange' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    {
      title: '',
      render: (_, record) => <Button size="small" onClick={() => setSelected(record)}>Détails</Button>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Réservations</Title>
        <Select value={statusFilter} onChange={v => setFilter(v)} style={{ width: 180 }} options={STATUS_OPTIONS} />
      </Space>

      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="id"
        loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: (p) => void fetchBookings(p) }}
        size="small"
      />

      <Modal
        title="Détail de la réservation"
        open={selected !== null}
        onCancel={() => setSelected(null)}
        footer={null}
        width={600}
      >
        {selected !== null && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID" span={2}>{selected.id}</Descriptions.Item>
            <Descriptions.Item label="Client">{selected.clientName}</Descriptions.Item>
            <Descriptions.Item label="Prestataire">{selected.providerName}</Descriptions.Item>
            <Descriptions.Item label="Service">{selected.serviceType}</Descriptions.Item>
            <Descriptions.Item label="Durée">{selected.durationHours}h</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(selected.scheduledDate).format('DD/MM/YYYY')} {selected.scheduledTime}</Descriptions.Item>
            <Descriptions.Item label="Paiement">{selected.paymentMethod}</Descriptions.Item>
            <Descriptions.Item label="Montant total">{selected.totalAmount.toFixed(2)} MAD</Descriptions.Item>
            <Descriptions.Item label="Commission">{selected.commission.toFixed(2)} MAD</Descriptions.Item>
            <Descriptions.Item label="Prestataire net">{selected.providerAmount.toFixed(2)} MAD</Descriptions.Item>
            <Descriptions.Item label="Statut paiement"><Tag color={selected.paymentStatus === 'PAID' ? 'green' : 'orange'}>{selected.paymentStatus}</Tag></Descriptions.Item>
            <Descriptions.Item label="Statut"><Tag color={STATUS_COLOR[selected.status]}>{STATUS_LABEL[selected.status]}</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
