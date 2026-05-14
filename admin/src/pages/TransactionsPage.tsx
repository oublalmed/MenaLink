import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Space, Select, Statistic, Row, Col, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface AdminTransaction {
  id: string;
  type: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  userName: string;
  description: string;
  createdAt: string;
}

interface TxStats {
  totalPayments: number;
  totalCommissions: number;
  totalWithdrawals: number;
  totalRefunds: number;
}

const TYPE_COLOR: Record<string, string>  = { PAYMENT: 'green', REFUND: 'orange', WITHDRAWAL: 'blue', COMMISSION: 'purple' };
const TYPE_LABEL: Record<string, string>  = { PAYMENT: 'Paiement', REFUND: 'Remboursement', WITHDRAWAL: 'Retrait', COMMISSION: 'Commission' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'orange', SUCCESS: 'green', FAILED: 'red' };

export default function TransactionsPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [stats, setStats]               = useState<TxStats | null>(null);
  const [isLoading, setLoading]         = useState(true);
  const [typeFilter, setFilter]         = useState('ALL');
  const [pagination, setPaging]         = useState({ page: 1, total: 0, limit: 20 });

  const fetchTransactions = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      const res = await apiClient.get<{ data: { items: AdminTransaction[]; total: number; stats?: TxStats } }>(
        `/admin/transactions?${params.toString()}`
      );
      setTransactions(res.data.data.items);
      if (res.data.data.stats) setStats(res.data.data.stats);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchTransactions(1); }, [typeFilter]);

  const columns: ColumnsType<AdminTransaction> = [
    { title: 'Utilisateur', dataIndex: 'userName' },
    {
      title: 'Type', dataIndex: 'type',
      render: (t: string) => <Tag color={TYPE_COLOR[t]}>{TYPE_LABEL[t]}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    {
      title: 'Montant', dataIndex: 'amount',
      render: (a: number, r) => (
        <span style={{ color: r.type === 'PAYMENT' || r.type === 'COMMISSION' ? '#27AE60' : '#E74C3C', fontWeight: 600 }}>
          {r.type === 'WITHDRAWAL' || r.type === 'REFUND' ? '-' : '+'}{a.toFixed(2)} MAD
        </span>
      ),
    },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag>,
    },
    { title: 'Date', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>Transactions</Title>

      {stats !== null && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { title: 'Paiements', value: stats.totalPayments, color: '#27AE60' },
            { title: 'Commissions', value: stats.totalCommissions, color: '#8E44AD' },
            { title: 'Retraits', value: stats.totalWithdrawals, color: '#E8963A' },
            { title: 'Remboursements', value: stats.totalRefunds, color: '#E67E22' },
          ].map(s => (
            <Col xs={12} lg={6} key={s.title}>
              <Card size="small">
                <Statistic title={s.title} value={s.value} precision={2} suffix="MAD" valueStyle={{ color: s.color, fontSize: 18 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Space style={{ marginBottom: 16 }}>
        <Select value={typeFilter} onChange={v => setFilter(v)} style={{ width: 180 }}
          options={[{ value: 'ALL', label: 'Tous les types' }, ...Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))]} />
      </Space>

      <Table columns={columns} dataSource={transactions} rowKey="id" loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: p => void fetchTransactions(p) }}
        size="small" />
    </div>
  );
}
