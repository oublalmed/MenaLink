import React, { useState } from 'react';
import {
  Table, Tag, Typography, Avatar, Space, Input, Select, Button,
  Modal, Spin, Tabs, Statistic, Row, Col, Popconfirm, message,
} from 'antd';
import {
  UserOutlined, EyeOutlined, DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  city?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
}

interface ClientDetail extends AdminClient {
  bookings: {
    id: string;
    serviceType: string;
    scheduledDate: string;
    totalAmount: number;
    status: string;
    providerName: string;
  }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green',
  PENDING: 'orange',
  SUSPENDED: 'red',
  BANNED: 'volcano',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  SUSPENDED: 'Suspendu',
  BANNED: 'Banni',
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
  DISPUTED: 'volcano',
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

function exportToExcel(clients: AdminClient[]): void {
  void import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(
      clients.map((c) => ({
        Nom: `${c.firstName} ${c.lastName}`,
        Email: c.email,
        Téléphone: c.phone,
        Ville: c.city ?? '',
        Réservations: c.totalBookings,
        'CA généré (MAD)': c.totalSpent,
        Statut: c.status,
        Inscription: dayjs(c.createdAt).format('DD/MM/YYYY'),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `clients_${dayjs().format('YYYYMMDD')}.xlsx`);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const [detailId, setDetailId] = useState<string | null>(null);

  // ── List Query ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, statusFilter, cityFilter],
    queryFn: () =>
      apiClient
        .get('/admin/users', {
          params: {
            role: 'CLIENT',
            page,
            limit: 20,
            search: search || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            city: cityFilter || undefined,
          },
        })
        .then((r) => r.data.data as { items: AdminClient[]; total: number }),
  });

  const clients = data?.items ?? [];
  const total = data?.total ?? 0;

  // ── Detail Query ────────────────────────────────────────────────────────────

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['client-detail', detailId],
    queryFn: () =>
      apiClient
        .get(`/admin/users/${detailId}`)
        .then((r) => r.data.data as ClientDetail),
    enabled: detailId !== null,
  });

  // ── Status Mutation ─────────────────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      void message.success('Statut mis à jour');
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['client-detail', detailId] });
    },
    onError: () => {
      void message.error('Erreur lors de la mise à jour du statut');
    },
  });

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnsType<AdminClient> = [
    {
      title: '',
      key: 'avatar',
      width: 48,
      render: (_, r) => <Avatar src={r.avatarUrl} icon={<UserOutlined />} />,
    },
    {
      title: 'Nom',
      key: 'name',
      width: 180,
      render: (_, r) => (
        <Text strong>
          {r.firstName} {r.lastName}
        </Text>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 220,
      render: (_, r) => (
        <div>
          <div>{r.email}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ville',
      dataIndex: 'city',
      width: 120,
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Réservations',
      dataIndex: 'totalBookings',
      align: 'center',
      width: 110,
    },
    {
      title: 'CA généré',
      dataIndex: 'totalSpent',
      width: 140,
      render: (v: number) => (
        <Text style={{ color: '#2980B9' }}>{v.toFixed(2)} MAD</Text>
      ),
    },
    {
      title: 'Inscription',
      dataIndex: 'createdAt',
      width: 110,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] ?? s}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setDetailId(r.id)}
          >
            Voir
          </Button>
          <Popconfirm
            title={
              r.status === 'ACTIVE'
                ? 'Suspendre ce client ?'
                : 'Réactiver ce client ?'
            }
            onConfirm={() =>
              statusMutation.mutate({
                id: r.id,
                status: r.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
              })
            }
            okText="Confirmer"
            cancelText="Annuler"
          >
            <Button
              size="small"
              danger={r.status === 'ACTIVE'}
              type={r.status === 'ACTIVE' ? 'default' : 'primary'}
              ghost={r.status !== 'ACTIVE'}
            >
              {r.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Detail Modal helpers ────────────────────────────────────────────────────

  const bookingColumns: ColumnsType<ClientDetail['bookings'][number]> = [
    { title: 'Service', dataIndex: 'serviceType', width: 140 },
    {
      title: 'Date',
      dataIndex: 'scheduledDate',
      width: 110,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Montant',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v: number) => `${v.toFixed(2)} MAD`,
    },
    { title: 'Prestataire', dataIndex: 'providerName' },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => (
        <Tag color={BOOKING_STATUS_COLOR[s]}>
          {BOOKING_STATUS_LABEL[s] ?? s}
        </Tag>
      ),
    },
  ];

  const transactionColumns: ColumnsType<ClientDetail['transactions'][number]> = [
    { title: 'Type', dataIndex: 'type', width: 120 },
    {
      title: 'Montant',
      dataIndex: 'amount',
      width: 120,
      render: (v: number) => `${v.toFixed(2)} MAD`,
    },
    { title: 'Statut', dataIndex: 'status', width: 110 },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      width: 110,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <Space
        style={{
          marginBottom: 16,
          justifyContent: 'space-between',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Clients
        </Title>
        <Space wrap>
          <Input.Search
            placeholder="Rechercher..."
            allowClear
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
            style={{ width: 240 }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            options={[
              { value: 'ALL', label: 'Tous' },
              { value: 'ACTIVE', label: 'Actif' },
              { value: 'SUSPENDED', label: 'Suspendu' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'BANNED', label: 'Banni' },
            ]}
          />
          <Select
            placeholder="Ville"
            allowClear
            value={cityFilter}
            onChange={(v) => {
              setCityFilter(v as string | undefined);
              setPage(1);
            }}
            style={{ width: 140 }}
            options={[
              { value: 'Casablanca', label: 'Casablanca' },
              { value: 'Rabat', label: 'Rabat' },
              { value: 'Marrakech', label: 'Marrakech' },
              { value: 'Fès', label: 'Fès' },
              { value: 'Agadir', label: 'Agadir' },
            ]}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportToExcel(clients)}
            disabled={clients.length === 0}
          >
            Exporter Excel
          </Button>
        </Space>
      </Space>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `${t} clients`,
        }}
      />

      {/* Detail Modal */}
      <Modal
        open={detailId !== null}
        onCancel={() => setDetailId(null)}
        width={800}
        title={
          detail
            ? `Fiche client — ${detail.firstName} ${detail.lastName}`
            : 'Fiche client'
        }
        footer={
          <Space>
            <Button onClick={() => setDetailId(null)}>Fermer</Button>
            {detail?.status === 'ACTIVE' && (
              <Button
                danger
                loading={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({ id: detail.id, status: 'SUSPENDED' })
                }
              >
                Suspendre
              </Button>
            )}
            {detail?.status === 'SUSPENDED' && (
              <Button
                type="primary"
                loading={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({ id: detail.id, status: 'ACTIVE' })
                }
              >
                Réactiver
              </Button>
            )}
          </Space>
        }
        destroyOnClose
      >
        {detailLoading || !detail ? (
          <Spin
            size="large"
            style={{ display: 'block', margin: '60px auto' }}
          />
        ) : (
          <div>
            {/* Info row */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col flex="80px">
                <Avatar
                  size={80}
                  src={detail.avatarUrl}
                  icon={<UserOutlined />}
                />
              </Col>
              <Col flex="auto">
                <Space direction="vertical" size={2}>
                  <Text>
                    <Text strong>Email : </Text>
                    {detail.email}
                  </Text>
                  <Text>
                    <Text strong>Téléphone : </Text>
                    {detail.phone}
                  </Text>
                  <Text>
                    <Text strong>Ville : </Text>
                    {detail.city ?? '—'}
                  </Text>
                  <Space>
                    <Text strong>Statut : </Text>
                    <Tag color={STATUS_COLOR[detail.status]}>
                      {STATUS_LABEL[detail.status] ?? detail.status}
                    </Tag>
                  </Space>
                  <Text>
                    <Text strong>Membre depuis : </Text>
                    {dayjs(detail.createdAt).format('DD/MM/YYYY')}
                  </Text>
                </Space>
              </Col>
            </Row>

            {/* Stats */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f5f5f5',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <Statistic
                    title="Réservations"
                    value={detail.totalBookings}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f5f5f5',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <Statistic
                    title="CA total"
                    value={detail.totalSpent}
                    precision={2}
                    suffix="MAD"
                    valueStyle={{ color: '#2980B9' }}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f5f5f5',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <Statistic
                    title="Statut"
                    value={STATUS_LABEL[detail.status] ?? detail.status}
                    valueStyle={{ color: detail.status === 'ACTIVE' ? '#27AE60' : '#E74C3C', fontSize: 18 }}
                  />
                </div>
              </Col>
            </Row>

            {/* Tabs */}
            <Tabs
              items={[
                {
                  key: 'bookings',
                  label: `Réservations (${detail.bookings.length})`,
                  children: (
                    <Table
                      columns={bookingColumns}
                      dataSource={detail.bookings}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      scroll={{ x: 600 }}
                    />
                  ),
                },
                {
                  key: 'transactions',
                  label: `Transactions (${detail.transactions.length})`,
                  children: (
                    <Table
                      columns={transactionColumns}
                      dataSource={detail.transactions}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      scroll={{ x: 500 }}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
