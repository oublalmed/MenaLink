import React from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Spin,
  Table,
  Tag,
  Button,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BookingsByStatus {
  PENDING: number;
  CONFIRMED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
  DISPUTED: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface DailyBooking {
  date: string;
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
}

interface RecentBooking {
  id: string;
  clientName?: string;
  client?: { firstName?: string; lastName?: string; email?: string };
  providerName?: string;
  provider?: { firstName?: string; lastName?: string };
  serviceType?: string;
  service?: { name?: string; type?: string };
  scheduledDate?: string;
  date?: string;
  totalAmount?: number;
  amount?: number;
  status: string;
}

interface PendingProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  serviceTypes: string[];
}

interface DashboardData {
  totalRevenue: number;
  revenueTrend: number;
  totalBookings: number;
  bookingsByStatus: BookingsByStatus;
  totalActiveUsers: number;
  conversionRate: number;
  activeProviders: number;
  openDisputes: number;
  monthlyRevenue: MonthlyRevenue[];
  dailyBookings: DailyBooking[];
  recentBookings: RecentBooking[];
  pendingProviders: PendingProvider[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
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

const PIE_COLORS: Record<string, string> = {
  PENDING: '#E67E22',
  CONFIRMED: '#2980B9',
  IN_PROGRESS: '#1ABC9C',
  COMPLETED: '#27AE60',
  CANCELLED: '#E74C3C',
  DISPUTED: '#D35400',
};

// ---------------------------------------------------------------------------
// Empty / fallback data
// ---------------------------------------------------------------------------
const EMPTY_DATA: DashboardData = {
  totalRevenue: 0,
  revenueTrend: 0,
  totalBookings: 0,
  bookingsByStatus: { PENDING: 0, CONFIRMED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, DISPUTED: 0 },
  totalActiveUsers: 0,
  conversionRate: 0,
  activeProviders: 0,
  openDisputes: 0,
  monthlyRevenue: [],
  dailyBookings: [],
  recentBookings: [],
  pendingProviders: [],
};

// ---------------------------------------------------------------------------
// Helper formatters
// ---------------------------------------------------------------------------
function formatMAD(value: number): string {
  return `${value.toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD`;
}

function getClientName(b: RecentBooking): string {
  if (b.clientName) return b.clientName;
  if (b.client) return `${b.client.firstName ?? ''} ${b.client.lastName ?? ''}`.trim() || b.client.email || '—';
  return '—';
}

function getProviderName(b: RecentBooking): string {
  if (b.providerName) return b.providerName;
  if (b.provider) return `${b.provider.firstName ?? ''} ${b.provider.lastName ?? ''}`.trim() || '—';
  return '—';
}

function getServiceName(b: RecentBooking): string {
  if (b.serviceType) return b.serviceType;
  if (b.service) return b.service.name ?? b.service.type ?? '—';
  return '—';
}

function getBookingDate(b: RecentBooking): string {
  const d = b.scheduledDate ?? b.date;
  return d ? dayjs(d).format('DD/MM/YYYY') : '—';
}

function getAmount(b: RecentBooking): number {
  return b.totalAmount ?? b.amount ?? 0;
}

// ---------------------------------------------------------------------------
// KPI card component
// ---------------------------------------------------------------------------
interface KpiCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: number;
  valueStyle?: React.CSSProperties;
  precision?: number;
}

function KpiCard({ title, value, prefix, suffix, trend, valueStyle, precision }: KpiCardProps): React.JSX.Element {
  return (
    <Card
      style={{ borderRadius: 12, height: '100%' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Statistic
        title={<Text style={{ fontSize: 13, color: '#7F8C8D', fontWeight: 500 }}>{title}</Text>}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 26, fontWeight: 700, ...valueStyle }}
      />
      {trend !== undefined && (
        <div style={{ marginTop: 8 }}>
          {trend >= 0 ? (
            <Text style={{ color: '#27AE60', fontSize: 12 }}>
              <ArrowUpOutlined /> {Math.abs(trend).toFixed(1)}% vs mois dernier
            </Text>
          ) : (
            <Text style={{ color: '#E74C3C', fontSize: 12 }}>
              <ArrowDownOutlined /> {Math.abs(trend).toFixed(1)}% vs mois dernier
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      apiClient
        .get<{ data: DashboardData }>('/admin/dashboard')
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  // Use fetched data or fall back to empty data (no crash)
  const d: DashboardData = data ?? EMPTY_DATA;

  // Pie data from bookingsByStatus
  const pieData = Object.entries(d.bookingsByStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: STATUS_LABEL[name] ?? name, value, key: name }));

  // Recent bookings columns
  const recentColumns: ColumnsType<RecentBooking> = [
    {
      title: '#ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>{id.slice(0, 8)}</Text>
      ),
    },
    {
      title: 'Client',
      key: 'client',
      render: (_: unknown, b: RecentBooking) => getClientName(b),
    },
    {
      title: 'Prestataire',
      key: 'provider',
      render: (_: unknown, b: RecentBooking) => getProviderName(b),
    },
    {
      title: 'Service',
      key: 'service',
      render: (_: unknown, b: RecentBooking) => getServiceName(b),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: unknown, b: RecentBooking) => getBookingDate(b),
    },
    {
      title: 'Montant',
      key: 'amount',
      align: 'right',
      render: (_: unknown, b: RecentBooking) => (
        <Text strong>{formatMAD(getAmount(b))}</Text>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>
      ),
    },
  ];

  // Pending providers columns
  const providerColumns: ColumnsType<PendingProvider> = [
    {
      title: 'Nom',
      key: 'name',
      render: (_: unknown, p: PendingProvider) => `${p.firstName} ${p.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Services',
      dataIndex: 'serviceTypes',
      key: 'serviceTypes',
      render: (types: string[]) =>
        (types ?? []).map((t) => (
          <Tag key={t} style={{ marginBottom: 2 }}>
            {t}
          </Tag>
        )),
    },
    {
      title: 'Date inscription',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button
          type="primary"
          size="small"
          ghost
          onClick={() => navigate('/users/providers')}
        >
          Vérifier
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, color: '#2C3E50', fontWeight: 700 }}>
        Tableau de bord
      </Title>

      {/* ------------------------------------------------------------------ */}
      {/* KPI CARDS                                                            */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Chiffre d'affaires total"
            value={d.totalRevenue}
            suffix="MAD"
            precision={2}
            trend={d.revenueTrend}
            prefix={<DollarOutlined style={{ color: '#2980B9', marginRight: 4 }} />}
            valueStyle={{ color: '#2980B9' }}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Réservations totales"
            value={d.totalBookings}
            prefix={<CalendarOutlined style={{ color: '#8E44AD', marginRight: 4 }} />}
            valueStyle={{ color: '#8E44AD' }}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Utilisateurs actifs"
            value={d.totalActiveUsers}
            prefix={<UserOutlined style={{ color: '#27AE60', marginRight: 4 }} />}
            valueStyle={{ color: '#27AE60' }}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Taux de conversion"
            value={d.conversionRate}
            suffix="%"
            precision={1}
            prefix={<PercentageOutlined style={{ color: '#E67E22', marginRight: 4 }} />}
            valueStyle={{ color: '#E67E22' }}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Prestataires actifs"
            value={d.activeProviders}
            prefix={<TeamOutlined style={{ color: '#1ABC9C', marginRight: 4 }} />}
            valueStyle={{ color: '#1ABC9C' }}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <KpiCard
            title="Litiges ouverts"
            value={d.openDisputes}
            prefix={<WarningOutlined style={{ color: d.openDisputes > 0 ? '#E74C3C' : '#7F8C8D', marginRight: 4 }} />}
            valueStyle={{ color: d.openDisputes > 0 ? '#E74C3C' : '#7F8C8D' }}
          />
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* CHARTS ROW 1: Revenue Line + Booking Status Donut                   */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Revenue line chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Text strong style={{ fontSize: 14 }}>
                Chiffre d'affaires — 12 derniers mois
              </Text>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={d.monthlyRevenue} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECF0F1" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#7F8C8D' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: '#7F8C8D' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatMAD(v), "CA"]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #ECF0F1', fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2980B9"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#2980B9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Donut chart — booking status */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Text strong style={{ fontSize: 14 }}>
                Statuts réservations
              </Text>
            }
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '16px 16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={PIE_COLORS[entry.key] ?? '#95A5A6'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [v, name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #ECF0F1', fontSize: 13 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#BDC3C7', padding: 40 }}>
                <CalendarOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                Aucune donnée disponible
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* CHART ROW 2: Daily bookings stacked bar                             */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <Text strong style={{ fontSize: 14 }}>
                Réservations — 30 derniers jours
              </Text>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={d.dailyBookings}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                barSize={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ECF0F1" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#7F8C8D' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => dayjs(v).format('DD/MM')}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#7F8C8D' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #ECF0F1', fontSize: 13 }}
                  labelFormatter={(l: string) => dayjs(l).format('DD MMMM YYYY')}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="PENDING"   stackId="a" fill="#E67E22" name="En attente" radius={[0, 0, 0, 0]} />
                <Bar dataKey="CONFIRMED" stackId="a" fill="#2980B9" name="Confirmée"  radius={[0, 0, 0, 0]} />
                <Bar dataKey="COMPLETED" stackId="a" fill="#27AE60" name="Terminée"   radius={[0, 0, 0, 0]} />
                <Bar dataKey="CANCELLED" stackId="a" fill="#E74C3C" name="Annulée"    radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* ------------------------------------------------------------------ */}
      {/* TABLES                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recent bookings */}
        <Col xs={24} xl={15}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>Dernières réservations</Text>}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '0 0 8px' } }}
          >
            <Table
              columns={recentColumns}
              dataSource={d.recentBookings.slice(0, 10)}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 720 }}
            />
          </Card>
        </Col>

        {/* Pending providers */}
        <Col xs={24} xl={9}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>Prestataires en attente</Text>}
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '0 0 8px' } }}
          >
            <Table
              columns={providerColumns}
              dataSource={d.pendingProviders.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 400 }}
              locale={{ emptyText: 'Aucun prestataire en attente' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
