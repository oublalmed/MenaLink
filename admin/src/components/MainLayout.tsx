import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../store/adminAuthStore';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Tableau de bord' },
  { key: '/bookings', icon: <CalendarOutlined />, label: 'Réservations' },
  { key: '/users', icon: <UserOutlined />, label: 'Clients' },
  { key: '/providers', icon: <TeamOutlined />, label: 'Prestataires' },
  { key: '/services', icon: <AppstoreOutlined />, label: 'Services' },
];

export default function MainLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, firebaseUser } = useAdminAuth();

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Déconnexion',
        danger: true,
        onClick: () => void logout(),
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark" style={{ background: '#2C3E50' }}>
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: 20 }}>MenaLink</Text>
          <Text style={{ color: '#7F8C8D', display: 'block', fontSize: 12 }}>Admin</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: '#2C3E50', borderRight: 'none' }}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2980B9' }} />
              <Text>{firebaseUser?.email}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 12, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
