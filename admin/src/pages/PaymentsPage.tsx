import React, { useState } from 'react';
import {
  Row, Col, Card, Typography, Tag, Table, Tabs, Select, Button,
  Avatar, Modal, Input, Popconfirm, message, Space, Tooltip,
} from 'antd';
import {
  UserOutlined, ReloadOutlined, CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;

/* ─── Interfaces ─────────────────────────────────────────────────────────── */

interface AdminTransaction {
  id: string;
  bookingId?: string;
  userId: string;
  userName: string;
  type: 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'COMMISSION';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  gatewayRef?: string;
  description: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerPhone?: string;
  amount: number;
  bankName?: string;
  rib?: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

interface PaymentStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalCommissions: number;
  commissionsThisMonth: number;
  totalRefunds: number;
  refundsThisMonth: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  monthlyData: { month: string; revenue: number; commissions: number; refunds: number }[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const TX_TYPE_COLOR: Record<AdminTransaction['type'], string> = {
  PAYMENT: 'green',
  REFUND: 'orange',
  WITHDRAWAL: 'blue',
  COMMISSION: 'purple',
};

const TX_STATUS_COLOR: Record<AdminTransaction['status'], string> = {
  PENDING: 'orange',
  SUCCESS: 'green',
  FAILED: 'red',
};

const WD_STATUS_COLOR: Record<WithdrawalRequest['status'], string> = {
  PENDING: 'orange',
  PROCESSED: 'green',
  REJECTED: 'red',
};

function StatCard({
  title,
  value,
  suffix,
  sub,
  color = '#2980B9',
  danger = false,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  sub?: React.ReactNode;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Card
      size="small"
      style={{ borderRadius: 12, height: '100%' }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>{title}</Text>
      <div style={{ marginTop: 8 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: danger ? '#E74C3C' : color,
            lineHeight: 1.2,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{ marginLeft: 4, fontSize: 14, color: '#888' }}>{suffix}</span>
        )}
      </div>
      {sub && <div style={{ marginTop: 6, fontSize: 12 }}>{sub}</div>}
    </Card>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function PaymentsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  /* Transactions state */
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState<string>('ALL');
  const [txStatus, setTxStatus] = useState<string>('ALL');

  /* Withdrawals state */
  const [wdPage, setWdPage] = useState(1);
  const [wdStatus, setWdStatus] = useState<string>('ALL');

  /* Rejection modal state */
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [rejectNotes, setRejectNotes] = useState('');

  /* ── Queries ── */

  const statsQuery = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () =>
      apiClient.get('/admin/payments/stats').then((r) => r.data.data as PaymentStats),
  });

  const txQuery = useQuery({
    queryKey: ['transactions', txPage, txType, txStatus],
    queryFn: () =>
      apiClient
        .get('/admin/transactions', {
          params: {
            page: txPage,
            limit: 20,
            type: txType !== 'ALL' ? txType : undefined,
            status: txStatus !== 'ALL' ? txStatus : undefined,
          },
        })
        .then((r) => r.data.data as { items: AdminTransaction[]; total: number }),
  });

  const wdQuery = useQuery({
    queryKey: ['withdrawals', wdPage, wdStatus],
    queryFn: () =>
      apiClient
        .get('/admin/withdrawals', {
          params: {
            page: wdPage,
            limit: 15,
            status: wdStatus !== 'ALL' ? wdStatus : undefined,
          },
        })
        .then((r) => r.data.data as { items: WithdrawalRequest[]; total: number }),
  });

  /* ── Mutations ── */

  const wdMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: 'PROCESSED' | 'REJECTED';
      notes?: string;
    }) => apiClient.patch(`/admin/withdrawals/${id}`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      message.success('Statut du retrait mis à jour');
    },
    onError: () => {
      message.error('Erreur lors de la mise à jour');
    },
  });

  /* ── Handlers ── */

  const handleApprove = (id: string) => {
    wdMutation.mutate({ id, status: 'PROCESSED' });
  };

  const handleOpenReject = (id: string) => {
    setRejectNotes('');
    setRejectModal({ open: true, id });
  };

  const handleConfirmReject = () => {
    wdMutation.mutate({ id: rejectModal.id, status: 'REJECTED', notes: rejectNotes });
    setRejectModal({ open: false, id: '' });
  };

  /* ── Stats ── */

  const stats = statsQuery.data;

  /* ── Transaction columns ── */

  const txColumns: ColumnsType<AdminTransaction> = [
    {
      title: 'ID',
      key: 'id',
      width: 110,
      render: (_, r) => (
        <Space size={4}>
          <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {r.id.slice(0, 8)}
          </Text>
          <Tooltip title="Copier l'ID">
            <CopyOutlined
              style={{ cursor: 'pointer', color: '#888' }}
              onClick={() => {
                navigator.clipboard.writeText(r.id);
                message.success('ID copié');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Booking',
      key: 'bookingId',
      width: 100,
      render: (_, r) =>
        r.bookingId ? (
          <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {r.bookingId.slice(0, 8)}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Client/Prestataire',
      dataIndex: 'userName',
      key: 'userName',
      width: 160,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: AdminTransaction['type']) => (
        <Tag color={TX_TYPE_COLOR[type]}>{type}</Tag>
      ),
    },
    {
      title: 'Montant',
      key: 'amount',
      width: 130,
      render: (_, r) => {
        const positive = r.type === 'PAYMENT' || r.type === 'COMMISSION';
        return (
          <Text strong style={{ color: positive ? '#27AE60' : '#E74C3C' }}>
            {positive ? '+' : '-'}
            {r.amount.toFixed(2)} MAD
          </Text>
        );
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AdminTransaction['status']) => (
        <Tag color={TX_STATUS_COLOR[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Réf. Gateway',
      key: 'gatewayRef',
      width: 150,
      render: (_, r) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
          {r.gatewayRef ?? '—'}
        </Text>
      ),
    },
    {
      title: 'Date',
      key: 'createdAt',
      width: 140,
      render: (_, r) => dayjs(r.createdAt).format('DD/MM/YYYY HH:mm'),
    },
  ];

  /* ── Withdrawal columns ── */

  const wdColumns: ColumnsType<WithdrawalRequest> = [
    {
      title: 'Prestataire',
      key: 'provider',
      width: 200,
      render: (_, r) => (
        <Space>
          <Avatar icon={<UserOutlined />} size={32} style={{ backgroundColor: '#2980B9' }} />
          <div>
            <div>
              <Text strong>{r.providerName}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.providerEmail}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Montant',
      key: 'amount',
      width: 130,
      render: (_, r) => (
        <Text strong style={{ color: '#2980B9', fontSize: 15 }}>
          {r.amount.toFixed(2)} MAD
        </Text>
      ),
    },
    {
      title: 'Banque / RIB',
      key: 'bank',
      width: 180,
      render: (_, r) => (
        <div>
          <div>{r.bankName ?? '—'}</div>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.rib ?? '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: WithdrawalRequest['status']) => (
        <Tag color={WD_STATUS_COLOR[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Demandé le',
      key: 'createdAt',
      width: 120,
      render: (_, r) => dayjs(r.createdAt).format('DD/MM/YYYY'),
    },
    {
      title: 'Traité le',
      key: 'processedAt',
      width: 120,
      render: (_, r) =>
        r.processedAt ? dayjs(r.processedAt).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, r) =>
        r.status === 'PENDING' ? (
          <Space>
            <Popconfirm
              title="Approuver ce retrait ?"
              description="Le prestataire sera notifié."
              onConfirm={() => handleApprove(r.id)}
              okText="Approuver"
              cancelText="Annuler"
              okButtonProps={{ style: { backgroundColor: '#27AE60', borderColor: '#27AE60' } }}
            >
              <Button type="primary" size="small" style={{ backgroundColor: '#27AE60', borderColor: '#27AE60' }}>
                Approuver
              </Button>
            </Popconfirm>
            <Button
              danger
              size="small"
              onClick={() => handleOpenReject(r.id)}
            >
              Rejeter
            </Button>
          </Space>
        ) : null,
    },
  ];

  /* ── Render ── */

  const tabItems = [
    {
      key: 'transactions',
      label: 'Transactions',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              value={txType}
              onChange={(v) => { setTxType(v); setTxPage(1); }}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Tous les types' },
                { value: 'PAYMENT', label: 'PAYMENT' },
                { value: 'REFUND', label: 'REFUND' },
                { value: 'WITHDRAWAL', label: 'WITHDRAWAL' },
                { value: 'COMMISSION', label: 'COMMISSION' },
              ]}
            />
            <Select
              value={txStatus}
              onChange={(v) => { setTxStatus(v); setTxPage(1); }}
              style={{ width: 140 }}
              options={[
                { value: 'ALL', label: 'Tous statuts' },
                { value: 'PENDING', label: 'PENDING' },
                { value: 'SUCCESS', label: 'SUCCESS' },
                { value: 'FAILED', label: 'FAILED' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => txQuery.refetch()}
              loading={txQuery.isFetching}
            >
              Actualiser
            </Button>
          </Space>
          <Table<AdminTransaction>
            columns={txColumns}
            dataSource={txQuery.data?.items ?? []}
            rowKey="id"
            size="small"
            scroll={{ x: 1100 }}
            loading={txQuery.isLoading || txQuery.isFetching}
            pagination={{
              current: txPage,
              pageSize: 20,
              total: txQuery.data?.total ?? 0,
              onChange: (p) => setTxPage(p),
              showSizeChanger: false,
              showTotal: (t) => `${t} transactions`,
            }}
          />
        </div>
      ),
    },
    {
      key: 'withdrawals',
      label: 'Retraits prestataires',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              value={wdStatus}
              onChange={(v) => { setWdStatus(v); setWdPage(1); }}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Tous statuts' },
                { value: 'PENDING', label: 'PENDING' },
                { value: 'PROCESSED', label: 'PROCESSED' },
                { value: 'REJECTED', label: 'REJECTED' },
              ]}
            />
          </Space>
          <Table<WithdrawalRequest>
            columns={wdColumns}
            dataSource={wdQuery.data?.items ?? []}
            rowKey="id"
            size="small"
            scroll={{ x: 1000 }}
            loading={wdQuery.isLoading || wdQuery.isFetching}
            pagination={{
              current: wdPage,
              pageSize: 15,
              total: wdQuery.data?.total ?? 0,
              onChange: (p) => setWdPage(p),
              showSizeChanger: false,
              showTotal: (t) => `${t} demandes`,
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>Paiements & Finances</Title>

      {/* ── Stats Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="CA total"
            value={stats ? stats.totalRevenue.toFixed(2) : '—'}
            suffix="MAD"
            color="#2980B9"
            sub={
              stats && (
                <Text type="secondary">
                  Ce mois:{' '}
                  <Text style={{ color: '#27AE60' }}>
                    +{stats.revenueThisMonth.toFixed(2)} MAD
                  </Text>
                </Text>
              )
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Commissions"
            value={stats ? stats.totalCommissions.toFixed(2) : '—'}
            suffix="MAD"
            color="#8E44AD"
            sub={
              stats && (
                <Text type="secondary">
                  Ce mois:{' '}
                  <Text style={{ color: '#8E44AD' }}>
                    +{stats.commissionsThisMonth.toFixed(2)} MAD
                  </Text>
                </Text>
              )
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Remboursements"
            value={stats ? stats.totalRefunds.toFixed(2) : '—'}
            suffix="MAD"
            color="#E67E22"
            sub={
              stats && (
                <Text type="secondary">
                  Ce mois:{' '}
                  <Text style={{ color: '#E67E22' }}>
                    +{stats.refundsThisMonth.toFixed(2)} MAD
                  </Text>
                </Text>
              )
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Retraits en attente"
            value={stats ? stats.pendingWithdrawals : '—'}
            suffix="demandes"
            color="#E74C3C"
            danger={(stats?.pendingWithdrawals ?? 0) > 0}
            sub={
              stats && (
                <Text type="secondary">
                  Montant:{' '}
                  <Text style={{ color: '#E74C3C' }}>
                    {stats.pendingWithdrawalsAmount.toFixed(2)} MAD
                  </Text>
                </Text>
              )
            }
          />
        </Col>
      </Row>

      {/* ── Monthly Chart ── */}
      <Card
        title="Évolution mensuelle"
        style={{ borderRadius: 12, marginBottom: 24 }}
        loading={statsQuery.isLoading}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={stats?.monthlyData ?? []}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip formatter={(v: number) => `${v} MAD`} />
            <Legend />
            <Bar dataKey="revenue" name="CA" fill="#2980B9" radius={[3, 3, 0, 0]} />
            <Bar dataKey="commissions" name="Commissions" fill="#8E44AD" radius={[3, 3, 0, 0]} />
            <Bar dataKey="refunds" name="Remboursements" fill="#E67E22" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Tabs ── */}
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '0 16px' }}>
          <Tabs
            items={tabItems}
            tabBarStyle={{ marginBottom: 0 }}
            style={{ padding: '0 0 16px' }}
          />
        </div>
      </Card>

      {/* ── Rejection Modal ── */}
      <Modal
        title="Motif de rejet"
        open={rejectModal.open}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModal({ open: false, id: '' })}
        okText="Confirmer le rejet"
        cancelText="Annuler"
        okButtonProps={{ danger: true, loading: wdMutation.isPending }}
      >
        <p style={{ marginBottom: 8 }}>
          Veuillez indiquer la raison du rejet (optionnel) :
        </p>
        <Input.TextArea
          rows={4}
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          placeholder="Ex : Informations bancaires incorrectes, montant insuffisant..."
        />
      </Modal>
    </div>
  );
}
