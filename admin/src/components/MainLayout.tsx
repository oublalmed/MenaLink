import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Badge,
  Input,
  Breadcrumb,
  List,
  Divider,
  Button,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from '../store/adminAuthStore';
import apiClient from '../services/api';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// ---------------------------------------------------------------------------
// Route metadata
// ---------------------------------------------------------------------------
interface RouteInfo {
  key: string;
  label: string;
  icon: React.ReactNode;
  breadcrumb: string;
}

const ROUTES: RouteInfo[] = [
  { key: '/',               label: 'Tableau de bord', icon: <DashboardOutlined />, breadcrumb: 'Tableau de bord' },
  { key: '/bookings',       label: 'Réservations',    icon: <CalendarOutlined />,  breadcrumb: 'Réservations' },
  { key: '/users/clients',  label: 'Clients',          icon: <UserOutlined />,      breadcrumb: 'Clients' },
  { key: '/users/providers',label: 'Prestataires',    icon: <TeamOutlined />,      breadcrumb: 'Prestataires' },
  { key: '/payments',       label: 'Paiements',        icon: <DollarOutlined />,    breadcrumb: 'Paiements' },
  { key: '/disputes',       label: 'Litiges',          icon: <WarningOutlined />,   breadcrumb: 'Litiges' },
  { key: '/settings',       label: 'Paramètres',       icon: <SettingOutlined />,   breadcrumb: 'Paramètres' },
];

const SEGMENT_LABELS: Record<string, string> = {
  '':           'Tableau de bord',
  bookings:     'Réservations',
  users:        'Utilisateurs',
  clients:      'Clients',
  providers:    'Prestataires',
  payments:     'Paiements',
  disputes:     'Litiges',
  settings:     'Paramètres',
};

// ---------------------------------------------------------------------------
// Mock notifications
// ---------------------------------------------------------------------------
const MOCK_NOTIFICATIONS = [
  { id: 1, title: '3 nouvelles demandes', desc: 'Des prestataires attendent validation', time: 'Il y a 10 min' },
  { id: 2, title: '1 litige ouvert',       desc: 'Un litige requiert votre attention',   time: 'Il y a 35 min' },
  { id: 3, title: '2 retraits en attente', desc: 'Des demandes de retrait à traiter',    time: 'Il y a 1h' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SidebarLogo({ collapsed }: { collapsed: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        padding: collapsed ? '20px 8px' : '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'padding 0.2s',
        minHeight: 72,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #E8963A 0%, #C4762A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DashboardOutlined style={{ color: '#fff', fontSize: 18 }} />
      </div>
      {!collapsed && (
        <div style={{ overflow: 'hidden' }}>
          <Text
            strong
            style={{
              color: '#fff',
              fontSize: 16,
              display: 'block',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            MenaLink Admin
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' }}>
            Back-office
          </Text>
        </div>
      )}
    </div>
  );
}

function NotificationsDropdown(): React.JSX.Element {
  const content = (
    <div style={{ width: 320 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Notifications</Text>
        <Badge count={MOCK_NOTIFICATIONS.length} style={{ backgroundColor: '#E74C3C' }} />
      </div>
      <List
        dataSource={MOCK_NOTIFICATIONS}
        renderItem={(item) => (
          <List.Item
            style={{ padding: '10px 16px', cursor: 'pointer' }}
            className="notification-item"
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={36}
                  style={{ backgroundColor: '#E8963A', flexShrink: 0 }}
                  icon={<BellOutlined />}
                />
              }
              title={<Text strong style={{ fontSize: 13 }}>{item.title}</Text>}
              description={
                <div>
                  <Text style={{ fontSize: 12, color: '#7F8C8D' }}>{item.desc}</Text>
                  <br />
                  <Text style={{ fontSize: 11, color: '#BDC3C7' }}>{item.time}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
        <Button type="link" size="small" style={{ fontSize: 13 }}>
          Voir toutes les notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => (
        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {content}
        </div>
      )}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={MOCK_NOTIFICATIONS.length} size="small" style={{ backgroundColor: '#E74C3C' }}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------
export default function MainLayout(): React.JSX.Element {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout, firebaseUser } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on narrow screens
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth < 1200) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disputes open count — refetch every 60s
  const { data: openDisputeCount = 0 } = useQuery({
    queryKey: ['disputes-count'],
    queryFn: () =>
      apiClient.get<{ data: { open: number } }>('/admin/disputes/count').then(
        (r) => r.data.data?.open ?? 0,
      ),
    refetchInterval: 60_000,
  });

  // ---------------------------------------------------------------------------
  // Menu items with badge for disputes
  // ---------------------------------------------------------------------------
  const menuItems = ROUTES.map((r) => ({
    key: r.key,
    icon: r.icon,
    label:
      r.key === '/disputes' && openDisputeCount > 0 ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {r.label}
          <Badge count={openDisputeCount} size="small" style={{ backgroundColor: '#E74C3C', marginLeft: 8 }} />
        </span>
      ) : (
        r.label
      ),
  }));

  // ---------------------------------------------------------------------------
  // Breadcrumb from pathname
  // ---------------------------------------------------------------------------
  const breadcrumbItems = React.useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [{ title: 'Accueil' }];
    segments.forEach((seg) => {
      items.push({ title: SEGMENT_LABELS[seg] ?? seg });
    });
    if (segments.length === 0) {
      return [{ title: 'Tableau de bord' }];
    }
    return items;
  }, [location.pathname]);

  // Active menu key — match exact or closest parent
  const selectedKey = React.useMemo(() => {
    const path = location.pathname;
    const match = ROUTES.slice().reverse().find((r) => path === r.key || path.startsWith(r.key + '/'));
    return match ? match.key : '/';
  }, [location.pathname]);

  // ---------------------------------------------------------------------------
  // User menu (top-right avatar)
  // ---------------------------------------------------------------------------
  const userMenuItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Mon profil',
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Déconnexion',
        danger: true,
        onClick: () => void logout(),
      },
    ],
  };

  const adminEmail = firebaseUser?.email ?? 'Admin';
  const adminInitial = adminEmail.charAt(0).toUpperCase();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Sider
        width={240}
        collapsedWidth={72}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#1B3A2D',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <SidebarLogo collapsed={collapsed} />

          {/* Navigation menu */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              style={{
                background: 'transparent',
                borderRight: 'none',
                marginTop: 8,
              }}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
            />
          </div>

          {/* Bottom: admin info + logout */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: collapsed ? '12px 8px' : '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Avatar
              size={36}
              style={{
                backgroundColor: '#E8963A',
                flexShrink: 0,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {adminInitial}
            </Avatar>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 12,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {adminEmail}
                </Text>
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={() => void logout()}
                  style={{ padding: 0, height: 'auto', fontSize: 12 }}
                >
                  Déconnexion
                </Button>
              </div>
            )}
            {collapsed && (
              <Tooltip title="Déconnexion" placement="right">
                <Button
                  type="text"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => void logout()}
                  size="small"
                  style={{ marginLeft: -4 }}
                />
              </Tooltip>
            )}
          </div>

          {/* Collapse trigger */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              padding: '10px 0',
              textAlign: 'center',
              cursor: 'pointer',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 16,
              transition: 'color 0.2s',
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
      </Sider>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Layout
        style={{
          marginLeft: collapsed ? 72 : 240,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #ECF0F1',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {/* Left: Breadcrumb */}
          <Breadcrumb
            items={breadcrumbItems}
            style={{ fontSize: 14 }}
          />

          {/* Right: Search + Notifications + User */}
          <Space size={12} align="center">
            {/* Global Search */}
            <Input
              prefix={<SearchOutlined style={{ color: '#BDC3C7' }} />}
              placeholder="Rechercher..."
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />

            {/* Notifications */}
            <NotificationsDropdown />

            <Divider type="vertical" style={{ height: 28, margin: '0 4px' }} />

            {/* User avatar + email dropdown */}
            <Dropdown menu={userMenuItems} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer' }} size={8}>
                <Avatar
                  size={34}
                  style={{ backgroundColor: '#E8963A', fontWeight: 700, fontSize: 14 }}
                >
                  {adminInitial}
                </Avatar>
                <Text style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminEmail}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}
        <Content
          style={{
            background: '#FBF4EC',
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
