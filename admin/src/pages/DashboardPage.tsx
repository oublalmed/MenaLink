import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Table, Tag } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title } = Typography;

interface KPIs {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  commissionEarned: number;
  conversionRate: number;
  openDisputes: number;
  pendingWithdrawals: number;
}

interface RecentBooking {
  id: string;
  clientName: string;
  providerName: string;
  serviceType: string;
  scheduledDate: string;
  totalAmount: number;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange', CONFIRMED: 'blue', IN_PROGRESS: 'cyan',
  COMPLETED: 'green', CANCELLED: 'red', DISPUTED: 'volcano',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée', DISPUTED: 'Litige',
};

export default function DashboardPage(): React.JSX.Element {
  const [kpis, setKpis]       = useState<KPIs | null>(null);
  const [recent, setRecent]   = useState<RecentBooking[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [kpiRes, bookRes] = await Promise.all([
          apiClient.get<{ data: KPIs }>('/admin/dashboard'),
          apiClient.get<{ data: { items: RecentBooking[] } }>('/admin/bookings?limit=5&page=1'),
        ]);
        setKpis(kpiRes.data.data);
        setRecent(bookRes.data.data.items);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const columns: ColumnsType<RecentBooking> = [
    { title: 'Client', dataIndex: 'clientName' },
    { title: 'Prestataire', dataIndex: 'providerName' },
    { title: 'Service', dataIndex: 'serviceType' },
    { title: 'Date', dataIndex: 'scheduledDate', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Montant', dataIndex: 'totalAmount', render: (a: number) => `${a.toFixed(2)} MAD` },
    {
      title: 'Statut', dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
  ];

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Tableau de bord</Title>

      <Row gutter={[16, 16]}>
        {[
          { title: 'Clients', value: kpis?.totalUsers ?? 0, icon: <UserOutlined />, color: '#2980B9' },
          { title: 'Prestataires', value: kpis?.totalProviders ?? 0, icon: <TeamOutlined />, color: '#27AE60' },
          { title: 'Réservations', value: kpis?.totalBookings ?? 0, icon: <CalendarOutlined />, color: '#8E44AD' },
          { title: 'Taux de conversion', value: `${(kpis?.conversionRate ?? 0).toFixed(1)}%`, icon: <CheckCircleOutlined />, color: '#E67E22' },
          { title: 'Revenus totaux (MAD)', value: kpis?.totalRevenue ?? 0, precision: 2, icon: <DollarOutlined />, color: '#2C3E50' },
          { title: 'Commissions (MAD)', value: kpis?.commissionEarned ?? 0, precision: 2, icon: <DollarOutlined />, color: '#27AE60' },
          { title: 'Litiges ouverts', value: kpis?.openDisputes ?? 0, icon: <WarningOutlined />, color: '#E74C3C' },
          { title: 'Retraits en attente', value: kpis?.pendingWithdrawals ?? 0, icon: <DollarOutlined />, color: '#E67E22' },
        ].map(({ title, value, icon, color, precision }) => (
          <Col xs={24} sm={12} lg={6} key={title}>
            <Card>
              <Statistic
                title={title}
                value={value}
                precision={precision}
                prefix={React.cloneElement(icon as React.ReactElement, { style: { color } })}
                valueStyle={{ color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Dernières réservations" style={{ marginTop: 24 }}>
        <Table columns={columns} dataSource={recent} rowKey="id" pagination={false} size="small" />
      </Card>
    </div>
  );
}
