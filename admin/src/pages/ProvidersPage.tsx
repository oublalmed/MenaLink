import React, { useState } from 'react';
import {
  Table, Tag, Rate, Typography, Avatar, Space, Input, Tabs, Button,
  Modal, Alert, Image, Col, Row, Popconfirm, Badge, message,
} from 'antd';
import {
  UserOutlined, EyeOutlined, CheckOutlined, CloseOutlined,
  StopOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  city?: string;
  serviceTypes: string[];
  zone?: string;
  averageRating: number;
  totalReviews: number;
  totalMissions: number;
  totalRevenue: number;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  hourlyRateMin: number;
  hourlyRateMax: number;
  cinFrontUrl?: string;
  cinBackUrl?: string;
  portraitUrl?: string;
  createdAt: string;
  rejectionReason?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  CLEANING: 'Ménage',
  IRONING: 'Repassage',
  DEEP_CLEANING: 'Grand ménage',
  POST_CONSTRUCTION: 'Post-chantier',
  COOKING: 'Cuisine',
};

const VERIFICATION_COLOR: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

const VERIFICATION_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Vérifiée',
  REJECTED: 'Rejetée',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  PENDING: 'orange',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  PENDING: 'En attente',
};

// ─── Document Card helper ─────────────────────────────────────────────────────

function DocImage({ label, url }: { label: string; url?: string }): React.JSX.Element {
  return (
    <div style={{ marginBottom: 12 }}>
      <Text strong>{label}</Text>
      {url ? (
        <Image
          src={url}
          style={{ width: '100%', borderRadius: 8, marginTop: 8, display: 'block' }}
        />
      ) : (
        <div
          style={{
            height: 120,
            background: '#f5f5f5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <Text type="secondary">Non fourni</Text>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProvidersPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [search, setSearch] = useState('');
  const [verifyingProvider, setVerifyingProvider] = useState<AdminProvider | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ── List Query ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['providers', page, tab, search],
    queryFn: () =>
      apiClient
        .get('/admin/providers', {
          params: {
            page,
            limit: 15,
            search: search || undefined,
            verificationStatus: tab === 'pending' ? 'PENDING' : undefined,
            status:
              tab === 'active'
                ? 'ACTIVE'
                : tab === 'suspended'
                ? 'SUSPENDED'
                : undefined,
          },
        })
        .then(
          (r) =>
            r.data.data as {
              items: AdminProvider[];
              total: number;
              pendingCount: number;
            },
        ),
  });

  const providers = data?.items ?? [];
  const total = data?.total ?? 0;
  const pendingCount = data?.pendingCount ?? 0;

  // ── Verify Mutation ─────────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      reason?: string;
    }) =>
      apiClient.patch(`/admin/providers/${id}/verify`, {
        status,
        ...(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      void message.success('Statut de vérification mis à jour');
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
      setVerifyingProvider(null);
      setRejectionReason('');
    },
    onError: () => {
      void message.error('Erreur lors de la vérification');
    },
  });

  // ── Suspend Mutation ────────────────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      void message.success('Statut mis à jour');
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: () => {
      void message.error('Erreur lors de la mise à jour du statut');
    },
  });

  // ── Tab change ──────────────────────────────────────────────────────────────

  const handleTabChange = (key: string): void => {
    setTab(key as typeof tab);
    setPage(1);
    void queryClient.invalidateQueries({ queryKey: ['providers'] });
  };

  // ── Approve / Reject handlers ───────────────────────────────────────────────

  const handleApprove = (): void => {
    if (!verifyingProvider) return;
    verifyMutation.mutate({ id: verifyingProvider.id, status: 'APPROVED' });
  };

  const handleReject = (): void => {
    if (!verifyingProvider) return;
    if (!rejectionReason.trim()) {
      void message.warning('Le motif du refus est obligatoire');
      return;
    }
    verifyMutation.mutate({
      id: verifyingProvider.id,
      status: 'REJECTED',
      reason: rejectionReason.trim(),
    });
  };

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnsType<AdminProvider> = [
    {
      title: 'Prestataire',
      key: 'provider',
      width: 220,
      render: (_, r) => (
        <Space>
          <Avatar src={r.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>
              {r.firstName} {r.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Zone / Ville',
      key: 'zone',
      width: 130,
      render: (_, r) => r.zone ?? r.city ?? '—',
    },
    {
      title: 'Services',
      key: 'services',
      width: 180,
      render: (_, r) => {
        const displayed = r.serviceTypes.slice(0, 2);
        const extra = r.serviceTypes.length - 2;
        return (
          <Space size={4} wrap>
            {displayed.map((s) => (
              <Tag key={s} style={{ margin: 0 }}>
                {SERVICE_LABELS[s] ?? s}
              </Tag>
            ))}
            {extra > 0 && <Tag style={{ margin: 0 }}>+{extra}</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Note',
      key: 'rating',
      width: 180,
      render: (_, r) => (
        <Space size={4}>
          <Rate
            disabled
            defaultValue={r.averageRating}
            allowHalf
            style={{ fontSize: 12 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({r.totalReviews})
          </Text>
        </Space>
      ),
    },
    {
      title: 'Missions',
      dataIndex: 'totalMissions',
      width: 90,
      align: 'center',
    },
    {
      title: 'Revenus',
      dataIndex: 'totalRevenue',
      width: 120,
      render: (v: number) => `${v.toFixed(0)} MAD`,
    },
    {
      title: 'Vérification',
      dataIndex: 'verificationStatus',
      width: 120,
      render: (s: string) => (
        <Tag color={VERIFICATION_COLOR[s]}>{VERIFICATION_LABEL[s] ?? s}</Tag>
      ),
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
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            title="Voir / Vérifier"
            onClick={() => {
              setVerifyingProvider(r);
              setRejectionReason('');
            }}
          />
          {r.verificationStatus === 'PENDING' && (
            <>
              <Button
                icon={<CheckOutlined />}
                size="small"
                type="primary"
                title="Approuver"
                onClick={() => {
                  verifyMutation.mutate({ id: r.id, status: 'APPROVED' });
                }}
              />
              <Button
                icon={<CloseOutlined />}
                size="small"
                danger
                title="Rejeter"
                onClick={() => {
                  setVerifyingProvider(r);
                  setRejectionReason('');
                }}
              />
            </>
          )}
          <Popconfirm
            title={
              r.status === 'ACTIVE'
                ? 'Suspendre ce prestataire ?'
                : 'Réactiver ce prestataire ?'
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
              icon={<StopOutlined />}
              size="small"
              danger={r.status === 'ACTIVE'}
              title={r.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Tab items ───────────────────────────────────────────────────────────────

  const tabItems = [
    { key: 'all', label: 'Toutes' },
    {
      key: 'pending',
      label: (
        <Space size={6}>
          En attente
          {pendingCount > 0 && <Badge count={pendingCount} size="small" />}
        </Space>
      ),
    },
    { key: 'active', label: 'Actives' },
    { key: 'suspended', label: 'Suspendues' },
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
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Prestataires
        </Title>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher..."
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 240 }}
        />
      </Space>

      {/* Tabs */}
      <Tabs
        activeKey={tab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: setPage,
          showTotal: (t) => `${t} prestataires`,
        }}
      />

      {/* Verification / Detail Modal */}
      <Modal
        open={verifyingProvider !== null}
        onCancel={() => {
          setVerifyingProvider(null);
          setRejectionReason('');
        }}
        width={840}
        title="Vérification prestataire"
        footer={
          verifyingProvider?.verificationStatus === 'PENDING' ? (
            <Space>
              <Button
                onClick={() => {
                  setVerifyingProvider(null);
                  setRejectionReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                loading={verifyMutation.isPending}
                onClick={handleReject}
              >
                Rejeter
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={verifyMutation.isPending}
                onClick={handleApprove}
              >
                Approuver
              </Button>
            </Space>
          ) : (
            <Button
              onClick={() => {
                setVerifyingProvider(null);
                setRejectionReason('');
              }}
            >
              Fermer
            </Button>
          )
        }
        destroyOnClose
      >
        {verifyingProvider && (
          <Row gutter={24}>
            {/* Left: Provider info */}
            <Col span={12}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <Avatar
                    size={72}
                    src={verifyingProvider.avatarUrl}
                    icon={<UserOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      {verifyingProvider.firstName} {verifyingProvider.lastName}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text>
                    <Text strong>Email : </Text>
                    {verifyingProvider.email}
                  </Text>
                </div>
                <div>
                  <Text>
                    <Text strong>Téléphone : </Text>
                    {verifyingProvider.phone}
                  </Text>
                </div>
                <div>
                  <Text>
                    <Text strong>Ville : </Text>
                    {verifyingProvider.city ?? '—'}
                  </Text>
                </div>
                <div>
                  <Text strong>Services : </Text>
                  <Space size={4} wrap style={{ marginTop: 4 }}>
                    {verifyingProvider.serviceTypes.map((s) => (
                      <Tag key={s}>{SERVICE_LABELS[s] ?? s}</Tag>
                    ))}
                  </Space>
                </div>
                <div>
                  <Text>
                    <Text strong>Tarif horaire : </Text>
                    {verifyingProvider.hourlyRateMin}–
                    {verifyingProvider.hourlyRateMax} MAD/h
                  </Text>
                </div>
                <div>
                  <Text>
                    <Text strong>Membre depuis : </Text>
                    {dayjs(verifyingProvider.createdAt).format('DD/MM/YYYY')}
                  </Text>
                </div>
                <div>
                  <Text strong>Vérification : </Text>
                  <Tag
                    color={
                      VERIFICATION_COLOR[verifyingProvider.verificationStatus]
                    }
                  >
                    {VERIFICATION_LABEL[verifyingProvider.verificationStatus] ??
                      verifyingProvider.verificationStatus}
                  </Tag>
                </div>

                {/* Status alerts */}
                {verifyingProvider.verificationStatus === 'APPROVED' && (
                  <Alert
                    type="success"
                    message="Prestataire vérifiée"
                    showIcon
                  />
                )}
                {verifyingProvider.verificationStatus === 'REJECTED' && (
                  <Alert
                    type="error"
                    message={
                      verifyingProvider.rejectionReason
                        ? `Rejetée — Motif : ${verifyingProvider.rejectionReason}`
                        : 'Rejetée'
                    }
                    showIcon
                  />
                )}

                {/* Rejection reason input (only when PENDING) */}
                {verifyingProvider.verificationStatus === 'PENDING' && (
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 6 }}>
                      Motif du refus (obligatoire si rejet)
                    </Text>
                    <TextArea
                      rows={3}
                      placeholder="Motif du refus (obligatoire si rejet)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </Space>
            </Col>

            {/* Right: Documents */}
            <Col span={12}>
              <Text
                strong
                style={{
                  display: 'block',
                  fontSize: 15,
                  marginBottom: 12,
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: 8,
                }}
              >
                Documents
              </Text>
              <DocImage label="CIN recto" url={verifyingProvider.cinFrontUrl} />
              <DocImage label="CIN verso" url={verifyingProvider.cinBackUrl} />
              <DocImage label="Portrait" url={verifyingProvider.portraitUrl} />
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
