import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Space, Select, Button, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;

interface AdminDispute {
  id: string;
  bookingId: string;
  clientName: string;
  providerName: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'red', UNDER_REVIEW: 'orange', RESOLVED: 'green', CLOSED: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert', UNDER_REVIEW: 'En cours', RESOLVED: 'Résolu', CLOSED: 'Fermé',
};

export default function DisputesPage(): React.JSX.Element {
  const [disputes, setDisputes]   = useState<AdminDispute[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [statusFilter, setFilter] = useState('ALL');
  const [pagination, setPaging]   = useState({ page: 1, total: 0, limit: 15 });
  const [resolving, setResolving] = useState<AdminDispute | null>(null);
  const [resolution, setResolution] = useState('');

  const fetchDisputes = async (page = 1): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await apiClient.get<{ data: { items: AdminDispute[]; total: number } }>(
        `/admin/disputes?${params.toString()}`
      );
      setDisputes(res.data.data.items);
      setPaging(prev => ({ ...prev, total: res.data.data.total, page }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchDisputes(1); }, [statusFilter]);

  const handleResolve = async (): Promise<void> => {
    if (!resolving || !resolution.trim()) return;
    try {
      await apiClient.patch(`/admin/disputes/${resolving.id}`, { status: 'RESOLVED', resolution });
      void message.success('Litige résolu');
      setResolving(null);
      setResolution('');
      void fetchDisputes();
    } catch {
      void message.error('Erreur lors de la résolution');
    }
  };

  const columns: ColumnsType<AdminDispute> = [
    { title: 'Client', dataIndex: 'clientName' },
    { title: 'Prestataire', dataIndex: 'providerName' },
    { title: 'Raison', dataIndex: 'reason', ellipsis: true, width: 200 },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
    },
    { title: 'Ouvert le', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    {
      title: 'Actions',
      render: (_, r) => r.status === 'OPEN' || r.status === 'UNDER_REVIEW' ? (
        <Button size="small" type="primary" onClick={() => setResolving(r)}>Résoudre</Button>
      ) : (
        <Text type="secondary" style={{ fontSize: 12 }}>{r.resolution ?? '—'}</Text>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>Litiges</Title>
        <Select value={statusFilter} onChange={v => setFilter(v)} style={{ width: 180 }}
          options={[{ value: 'ALL', label: 'Tous' }, ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))]} />
      </Space>

      <Table columns={columns} dataSource={disputes} rowKey="id" loading={isLoading}
        pagination={{ current: pagination.page, total: pagination.total, pageSize: pagination.limit, onChange: p => void fetchDisputes(p) }}
        size="small" />

      <Modal title="Résoudre le litige" open={resolving !== null} onOk={() => void handleResolve()}
        onCancel={() => { setResolving(null); setResolution(''); }} okText="Confirmer" cancelText="Annuler">
        {resolving !== null && (
          <>
            <p><strong>Client :</strong> {resolving.clientName} — <strong>Prestataire :</strong> {resolving.providerName}</p>
            <p><strong>Raison :</strong> {resolving.reason}</p>
            <Input.TextArea rows={4} placeholder="Décision / résolution..." value={resolution}
              onChange={e => setResolution(e.target.value)} />
          </>
        )}
      </Modal>
    </div>
  );
}
