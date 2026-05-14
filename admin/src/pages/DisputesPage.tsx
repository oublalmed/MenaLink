import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Descriptions,
  Typography,
  message,
  Drawer,
  Card,
  Alert,
  Input,
  Statistic,
} from 'antd';
import {
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../services/api';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface AdminDispute {
  id: string;
  bookingId: string;
  clientName: string;
  clientId: string;
  providerName: string;
  providerId: string;
  reportedBy: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  reason: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    serviceType: string;
    scheduledDate: string;
    totalAmount: number;
    status: string;
  };
  messages?: { id: string; sender: string; content: string; createdAt: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'red',
  UNDER_REVIEW: 'orange',
  RESOLVED: 'green',
  CLOSED: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'orange',
  HIGH: 'red',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
};

// Simulated current admin email — in production, pull from auth context
const CURRENT_ADMIN_EMAIL = 'admin@menalink.ma';

const DisputesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'CLOSED'>('RESOLVED');

  const queryClient = useQueryClient();

  // List query
  const { data, isLoading } = useQuery({
    queryKey: ['disputes', page, statusFilter, priorityFilter],
    queryFn: () =>
      apiClient
        .get('/admin/disputes', {
          params: {
            page,
            limit: 15,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          },
        })
        .then((r) => r.data.data as { items: AdminDispute[]; total: number }),
  });

  // Detail query
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['dispute-detail', selectedId],
    queryFn: () =>
      apiClient
        .get(`/admin/disputes/${selectedId}`)
        .then((r) => r.data.data as AdminDispute),
    enabled: selectedId !== null,
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { status: string; resolution?: string; assignedTo?: string };
    }) => apiClient.patch(`/admin/disputes/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedId] });
      message.success('Litige mis à jour');
    },
    onError: () => {
      message.error('Erreur lors de la mise à jour');
    },
  });

  const openCount = (data?.items ?? []).filter((d) => d.status === 'OPEN').length;

  const handleTakeOver = (id: string) => {
    mutation.mutate({ id, body: { status: 'UNDER_REVIEW', assignedTo: CURRENT_ADMIN_EMAIL } });
  };

  const handleResolveConfirm = () => {
    if (!selectedId) return;
    mutation.mutate(
      { id: selectedId, body: { status: resolutionStatus, resolution: resolutionText } },
      {
        onSuccess: () => {
          setResolutionModalOpen(false);
          setResolutionText('');
        },
      }
    );
  };

  const columns: ColumnsType<AdminDispute> = [
    {
      title: 'ID',
      key: 'id',
      width: 100,
      render: (_, r) => (
        <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {r.id.slice(0, 8)}
        </Text>
      ),
    },
    {
      title: 'Réservation',
      key: 'bookingId',
      width: 110,
      render: (_, r) => (
        <a onClick={() => setSelectedId(r.id)} style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {r.bookingId.slice(0, 8)}
        </a>
      ),
    },
    {
      title: 'Signalé par',
      key: 'reportedBy',
      render: (_, r) => (
        <Space>
          <span>
            {r.reportedBy === 'CLIENT'
              ? r.clientName
              : r.reportedBy === 'PROVIDER'
              ? r.providerName
              : 'Admin'}
          </span>
          <Tag color={r.reportedBy === 'CLIENT' ? 'blue' : r.reportedBy === 'PROVIDER' ? 'purple' : 'default'}>
            {r.reportedBy === 'CLIENT'
              ? 'CLIENT'
              : r.reportedBy === 'PROVIDER'
              ? 'PRESTATAIRE'
              : 'ADMIN'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Raison',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      key: 'priority',
      render: (v) => (
        <Tag
          color={PRIORITY_COLOR[v] ?? 'default'}
          icon={v === 'HIGH' ? <ExclamationCircleOutlined /> : undefined}
        >
          {PRIORITY_LABEL[v] ?? v}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 220,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedId(r.id)}
          />
          {r.status === 'OPEN' && (
            <Button
              size="small"
              onClick={() => handleTakeOver(r.id)}
              loading={mutation.isPending}
            >
              Prendre en charge
            </Button>
          )}
          {r.status === 'UNDER_REVIEW' && (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setSelectedId(r.id);
                setResolutionModalOpen(true);
              }}
            >
              Résoudre
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const d = detailData;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space
        style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}
        wrap
      >
        <Title level={4} style={{ margin: 0 }}>
          Litiges
        </Title>
        <Space wrap>
          <Select
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={priorityFilter}
            onChange={(v) => {
              setPriorityFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Toutes priorités' },
              ...Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
          {openCount > 0 && (
            <Statistic
              value={openCount}
              suffix="litiges ouverts"
              valueStyle={{ color: '#E74C3C', fontSize: 16 }}
            />
          )}
        </Space>
      </Space>

      {/* Table */}
      <Table<AdminDispute>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 1100 }}
        rowClassName={(r) =>
          r.priority === 'HIGH' ? 'row-priority-high' : ''
        }
        pagination={{
          current: page,
          total: data?.total ?? 0,
          pageSize: 15,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (total) => `${total} litiges`,
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={`Litige #${selectedId?.slice(0, 8) ?? ''}`}
        width={680}
        loading={detailLoading}
        footer={
          d && (
            <Space wrap>
              {d.status === 'OPEN' && (
                <Button onClick={() => handleTakeOver(d.id)} loading={mutation.isPending}>
                  Prendre en charge
                </Button>
              )}
              {d.status === 'UNDER_REVIEW' && (
                <>
                  <Button
                    type="primary"
                    onClick={() => setResolutionModalOpen(true)}
                  >
                    Résoudre
                  </Button>
                  <Select
                    style={{ width: 140 }}
                    placeholder="Changer priorité"
                    onChange={(newPriority) => {
                      // We patch only the priority by embedding it as a custom field
                      // The API endpoint PATCH /admin/disputes/:id accepts partial body
                      apiClient
                        .patch(`/admin/disputes/${d.id}`, { priority: newPriority })
                        .then(() => {
                          queryClient.invalidateQueries({ queryKey: ['dispute-detail', selectedId] });
                          queryClient.invalidateQueries({ queryKey: ['disputes'] });
                          message.success('Priorité mise à jour');
                        })
                        .catch(() => message.error('Erreur'));
                    }}
                    options={Object.entries(PRIORITY_LABEL).map(([v, l]) => ({
                      value: v,
                      label: l,
                    }))}
                  />
                </>
              )}
            </Space>
          )
        }
      >
        {d && (
          <div>
            {/* Section 1 — Info litige */}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Statut">
                <Tag color={STATUS_COLOR[d.status]}>{STATUS_LABEL[d.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={PRIORITY_COLOR[d.priority]}>{PRIORITY_LABEL[d.priority]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Client">{d.clientName}</Descriptions.Item>
              <Descriptions.Item label="Prestataire">{d.providerName}</Descriptions.Item>
              <Descriptions.Item label="Signalé par">{d.reportedBy}</Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(d.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Raison" span={2}>
                {d.reason}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {d.description}
              </Descriptions.Item>
            </Descriptions>

            {/* Section 2 — Réservation associée */}
            {d.booking && (
              <Card size="small" title="Réservation associée" style={{ marginTop: 16 }}>
                <Descriptions size="small" column={3}>
                  <Descriptions.Item label="Service">
                    {d.booking.serviceType}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date">
                    {dayjs(d.booking.scheduledDate).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Montant">
                    {d.booking.totalAmount} MAD
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Section 3 — Historique messages */}
            {d.messages && d.messages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Historique des échanges</Text>
                <div
                  style={{
                    maxHeight: 240,
                    overflowY: 'auto',
                    marginTop: 8,
                  }}
                >
                  {d.messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '8px 12px',
                        background: '#f5f5f5',
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Space>
                        <Text strong style={{ fontSize: 12 }}>
                          {m.sender}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {dayjs(m.createdAt).format('DD/MM HH:mm')}
                        </Text>
                      </Space>
                      <div style={{ marginTop: 4 }}>{m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4 — Resolution */}
            {d.status === 'RESOLVED' && d.resolution && (
              <Alert
                type="success"
                message="Résolution"
                description={d.resolution}
                style={{ marginTop: 16 }}
                showIcon
              />
            )}
          </div>
        )}
      </Drawer>

      {/* Resolution Modal */}
      <Modal
        open={resolutionModalOpen}
        onCancel={() => {
          setResolutionModalOpen(false);
          setResolutionText('');
        }}
        title="Résoudre le litige"
        width={500}
        footer={
          <Space>
            <Button
              onClick={() => {
                setResolutionModalOpen(false);
                setResolutionText('');
              }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              onClick={handleResolveConfirm}
              loading={mutation.isPending}
              disabled={!resolutionText.trim()}
            >
              Confirmer
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <TextArea
            rows={5}
            placeholder="Détaillez la résolution apportée..."
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
          />
          <Select
            style={{ width: '100%' }}
            value={resolutionStatus}
            onChange={(v) => setResolutionStatus(v as 'RESOLVED' | 'CLOSED')}
            options={[
              { value: 'RESOLVED', label: 'Résolu' },
              { value: 'CLOSED', label: 'Fermé' },
            ]}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default DisputesPage;
