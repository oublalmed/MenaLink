import React, { useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Descriptions,
  Typography,
  message,
  Badge,
  Steps,
  Card,
  Segmented,
  Tooltip,
  Calendar,
  DatePicker,
} from 'antd';
import {
  EyeOutlined,
  StopOutlined,
  CopyOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../services/api';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface AdminBooking {
  id: string;
  clientName: string;
  clientId: string;
  providerName: string;
  providerId: string;
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
  address?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
  DISPUTED: 'volcano',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

const SERVICE_LABEL: Record<string, string> = {
  CLEANING: 'Ménage',
  IRONING: 'Repassage',
  DEEP_CLEANING: 'Grand ménage',
  POST_CONSTRUCTION: 'Post-chantier',
  COOKING: 'Cuisine',
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  SUCCESS: 'green',
  FAILED: 'red',
};

const BookingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings', page, statusFilter, dateRange, cityFilter, searchText],
    queryFn: () =>
      apiClient
        .get('/admin/bookings', {
          params: {
            page,
            limit: 20,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            dateFrom: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
            dateTo: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
            city: cityFilter || undefined,
            search: searchText || undefined,
          },
        })
        .then((r) => r.data.data as { items: AdminBooking[]; total: number }),
  });

  const bookingsByDate = useMemo(() => {
    const map: Record<string, AdminBooking[]> = {};
    (data?.items ?? []).forEach((b) => {
      const key = b.scheduledDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [data]);

  function getBadgeColor(statusColor: string): string {
    if (statusColor === 'orange') return '#E67E22';
    if (statusColor === 'blue') return '#2980B9';
    if (statusColor === 'green') return '#27AE60';
    if (statusColor === 'red') return '#E74C3C';
    if (statusColor === 'cyan') return '#1ABC9C';
    if (statusColor === 'volcano') return '#E74C3C';
    return '#999';
  }

  function dateCellRender(date: dayjs.Dayjs) {
    const key = date.format('YYYY-MM-DD');
    const items = bookingsByDate[key] ?? [];
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.slice(0, 3).map((b) => (
          <li
            key={b.id}
            onClick={() => setSelectedBooking(b)}
            style={{ cursor: 'pointer' }}
          >
            <Badge
              color={getBadgeColor(STATUS_COLOR[b.status])}
              text={<span style={{ fontSize: 11 }}>{b.clientName}</span>}
            />
          </li>
        ))}
        {items.length > 3 && (
          <li style={{ fontSize: 11, color: '#2980B9' }}>
            +{items.length - 3} autres
          </li>
        )}
      </ul>
    );
  }

  const columns: ColumnsType<AdminBooking> = [
    {
      title: 'ID',
      key: 'id',
      width: 110,
      render: (_, r) => (
        <Space size={4}>
          <Text code style={{ fontSize: 12 }}>
            {r.id.slice(0, 8)}
          </Text>
          <Tooltip title="Copier l'ID">
            <CopyOutlined
              style={{ cursor: 'pointer', color: '#999' }}
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
      title: 'Client',
      dataIndex: 'clientName',
      key: 'clientName',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Prestataire',
      dataIndex: 'providerName',
      key: 'providerName',
      render: (v) => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Service',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (v) => SERVICE_LABEL[v] ?? v,
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, r) => (
        <div>
          <div>{dayjs(r.scheduledDate).format('DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.scheduledTime}
          </Text>
        </div>
      ),
    },
    {
      title: 'Durée',
      dataIndex: 'durationHours',
      key: 'durationHours',
      render: (v) => `${v}h`,
      width: 70,
    },
    {
      title: 'Montant',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => <Text strong>{v.toFixed(2)} MAD</Text>,
    },
    {
      title: 'Paiement',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (v) => (
        <Tag color={PAYMENT_STATUS_COLOR[v] ?? 'default'}>{v}</Tag>
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
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 80,
      render: (_, r) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedBooking(r)}
        />
      ),
    },
  ];

  const TIMELINE_STEPS = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Space
        style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}
        wrap
      >
        <Title level={4} style={{ margin: 0 }}>
          Réservations
        </Title>
        <Space wrap>
          <Input.Search
            style={{ width: 200 }}
            placeholder="Client ou prestataire..."
            onSearch={(v) => {
              setSearchText(v);
              setPage(1);
            }}
            allowClear
          />
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
          <RangePicker
            format="DD/MM/YYYY"
            onChange={(vals: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
              setDateRange(vals);
              setPage(1);
            }}
          />
          <Select
            style={{ width: 130 }}
            placeholder="Ville"
            allowClear
            value={cityFilter || undefined}
            onChange={(v) => {
              setCityFilter(v ?? '');
              setPage(1);
            }}
            options={[
              { value: 'Casablanca', label: 'Casablanca' },
              { value: 'Rabat', label: 'Rabat' },
              { value: 'Marrakech', label: 'Marrakech' },
              { value: 'Fès', label: 'Fès' },
              { value: 'Agadir', label: 'Agadir' },
            ]}
          />
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'table' | 'calendar')}
            options={[
              { label: 'Tableau', value: 'table', icon: <UnorderedListOutlined /> },
              { label: 'Calendrier', value: 'calendar', icon: <CalendarOutlined /> },
            ]}
          />
        </Space>
      </Space>

      {/* Table view */}
      {viewMode === 'table' && (
        <Table<AdminBooking>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            total: data?.total ?? 0,
            pageSize: 20,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `${total} réservations`,
          }}
        />
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <Card>
          <Calendar cellRender={dateCellRender} />
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        open={selectedBooking !== null}
        onCancel={() => setSelectedBooking(null)}
        title={`Réservation #${selectedBooking?.id.slice(0, 8)}`}
        width={720}
        footer={null}
      >
        {selectedBooking && (
          <div>
            {/* Basic Info */}
            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Client">
                <Text strong>{selectedBooking.clientName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Prestataire">
                {selectedBooking.providerName}
              </Descriptions.Item>
              <Descriptions.Item label="Service">
                {SERVICE_LABEL[selectedBooking.serviceType] ?? selectedBooking.serviceType}
              </Descriptions.Item>
              <Descriptions.Item label="Date & Heure">
                {dayjs(selectedBooking.scheduledDate).format('DD/MM/YYYY')} à{' '}
                {selectedBooking.scheduledTime}
              </Descriptions.Item>
              <Descriptions.Item label="Durée">
                {selectedBooking.durationHours}h
              </Descriptions.Item>
              <Descriptions.Item label="Adresse">
                {selectedBooking.address ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ville">
                {selectedBooking.city ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes">
                {selectedBooking.notes ?? '—'}
              </Descriptions.Item>
            </Descriptions>

            {/* Financial Info */}
            <Descriptions
              bordered
              size="small"
              column={3}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Montant total">
                <Text strong>{selectedBooking.totalAmount.toFixed(2)} MAD</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Commission (15%)">
                {selectedBooking.commission.toFixed(2)} MAD
              </Descriptions.Item>
              <Descriptions.Item label="Versement prestataire">
                {selectedBooking.providerAmount.toFixed(2)} MAD
              </Descriptions.Item>
            </Descriptions>

            {/* Status Actions */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space wrap>
                <Tag color={STATUS_COLOR[selectedBooking.status]}>
                  {STATUS_LABEL[selectedBooking.status] ?? selectedBooking.status}
                </Tag>
                <Text>Changer le statut :</Text>
                <Select
                  value={selectedBooking.status}
                  style={{ width: 160 }}
                  onChange={async (newStatus) => {
                    await apiClient.patch(
                      `/admin/bookings/${selectedBooking.id}/status`,
                      { status: newStatus }
                    );
                    message.success('Statut mis à jour');
                    refetch();
                    setSelectedBooking((prev) =>
                      prev ? { ...prev, status: newStatus } : null
                    );
                  }}
                  options={Object.entries(STATUS_LABEL).map(([v, l]) => ({
                    value: v,
                    label: l,
                  }))}
                />
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() =>
                    Modal.confirm({
                      title: 'Annuler cette réservation?',
                      onOk: async () => {
                        await apiClient.patch(
                          `/admin/bookings/${selectedBooking.id}/status`,
                          { status: 'CANCELLED' }
                        );
                        refetch();
                        setSelectedBooking(null);
                      },
                    })
                  }
                >
                  Annuler
                </Button>
              </Space>
            </Card>

            {/* Timeline */}
            <Steps
              size="small"
              current={TIMELINE_STEPS.indexOf(selectedBooking.status)}
              items={[
                {
                  title: 'En attente',
                  description: dayjs(selectedBooking.createdAt).format('DD/MM HH:mm'),
                },
                { title: 'Confirmée' },
                { title: 'En cours' },
                { title: 'Terminée' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;
