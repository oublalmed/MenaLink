import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Space, Button, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface WithdrawalRequest {
  id: string;
  providerName: string;
  providerEmail: string;
  amount: number;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
}

const STATUS_COLOR: Record<string, string> = { PENDING: 'orange', PROCESSED: 'green', REJECTED: 'red' };
const STATUS_LABEL: Record<string, string> = { PENDING: 'En attente', PROCESSED: 'Traité', REJECTED: 'Rejeté' };

export default function WithdrawalsPage(): React.JSX.Element {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setLoading]       = useState(true);
  const [pagination, setPaging]       = useState({ page: 1, total: 0, limit: 20 });

  const fetchWithdrawals = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: { items: WithdrawalRequest[]; total: number } }>(
        `/admin/withdrawals?page=${page}&limit=20&status=PENDING`
      );
      setWithdrawals(res.data.data.items);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchWithdrawals(); }, []);

  const handleAction = async (id: string, status: 'PROCESSED' | 'REJECTED'): Promise<void> => {
    const label = status === 'PROCESSED' ? 'approuvé' : 'rejeté';
    Modal.confirm({
      title: `${status === 'PROCESSED' ? 'Approuver' : 'Rejeter'} ce retrait ?`,
      content: 'Cette action est irréversible.',
      okType: status === 'REJECTED' ? 'danger' : 'primary',
      onOk: async () => {
        try {
          await apiClient.patch(`/admin/withdrawals/${id}`, { status });
          setWithdrawals(prev => prev.filter(w => w.id !== id));
          void message.success(`Retrait ${label}`);
        } catch {
          void message.error('Erreur lors du traitement');
        }
      },
    });
  };

  const columns: ColumnsType<WithdrawalRequest> = [
    { title: 'Prestataire', dataIndex: 'providerName' },
    { title: 'Email', dataIndex: 'providerEmail', ellipsis: true },
    {
      title: 'Montant', dataIndex: 'amount',
      render: (a: number) => <span style={{ fontWeight: 700, color: '#E8963A' }}>{a.toFixed(2)} MAD</span>,
    },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
    },
    { title: 'Demandé le', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Actions',
      render: (_, r) => r.status === 'PENDING' ? (
        <Space>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => void handleAction(r.id, 'PROCESSED')}>
            Approuver
          </Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => void handleAction(r.id, 'REJECTED')}>
            Rejeter
          </Button>
        </Space>
      ) : <span style={{ color: '#7F8C8D' }}>—</span>,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Demandes de retrait</Title>
      <Table columns={columns} dataSource={withdrawals} rowKey="id" loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: p => void fetchWithdrawals(p) }}
        size="small" />
    </div>
  );
}
