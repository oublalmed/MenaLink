import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import apiClient from '../services/api';

const { Title } = Typography;

interface DashboardStats {
  totalBookings: number;
  totalClients: number;
  totalProviders: number;
  totalRevenue: number;
  pendingBookings: number;
}

export default function DashboardPage(): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const [bookings, users] = await Promise.all([
          apiClient.get<{ data: { total: number; pending: number; revenue: number } }>('/bookings/stats'),
          apiClient.get<{ data: { clients: number; providers: number } }>('/users/stats'),
        ]);
        setStats({
          totalBookings: bookings.data.data.total,
          pendingBookings: bookings.data.data.pending,
          totalRevenue: bookings.data.data.revenue,
          totalClients: users.data.data.clients,
          totalProviders: users.data.data.providers,
        });
      } catch {
        // Stats non disponibles
      } finally {
        setIsLoading(false);
      }
    };
    void fetchStats();
  }, []);

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Tableau de bord</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Réservations totales"
              value={stats?.totalBookings ?? 0}
              prefix={<CalendarOutlined style={{ color: '#2980B9' }} />}
              valueStyle={{ color: '#2980B9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="En attente"
              value={stats?.pendingBookings ?? 0}
              prefix={<CalendarOutlined style={{ color: '#E67E22' }} />}
              valueStyle={{ color: '#E67E22' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Clients"
              value={stats?.totalClients ?? 0}
              prefix={<UserOutlined style={{ color: '#27AE60' }} />}
              valueStyle={{ color: '#27AE60' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chiffre d'affaires (MAD)"
              value={stats?.totalRevenue ?? 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#2C3E50' }} />}
              valueStyle={{ color: '#2C3E50' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
