import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, InputNumber, Switch, Button, Typography,
  message, Spin, Tabs, Table, Modal, Select, Space, Avatar,
} from 'antd';
import {
  SettingOutlined, DollarOutlined, CalendarOutlined,
  EnvironmentOutlined, AppstoreOutlined, PlusOutlined, EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

const { Title, Text } = Typography;

/* ─── Interfaces ─────────────────────────────────────────────────────────── */

interface AppSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  commissionRate: number;
  serviceFee: number;
  cancellationDelayHours: number;
  acceptanceDelayMinutes: number;
  defaultSearchRadiusKm: number;
  availableCities: string[];
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  youcanPayApiKey: string;
  youcanPayTestMode: boolean;
}

interface ServiceType {
  id: string;
  name: string;
  key: string;
  description: string;
  basePrice: number;
  isActive: boolean;
  icon?: string;
}

/* ─── Default settings ────────────────────────────────────────────────────── */

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'MenaLink',
  supportEmail: 'support@menalink.ma',
  supportPhone: '+212522000000',
  commissionRate: 15,
  serviceFee: 10,
  cancellationDelayHours: 24,
  acceptanceDelayMinutes: 30,
  defaultSearchRadiusKm: 20,
  availableCities: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Agadir'],
  maintenanceMode: false,
  allowNewRegistrations: true,
  youcanPayApiKey: '',
  youcanPayTestMode: true,
};

const DEFAULT_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Agadir',
  'Tanger', 'Oujda', 'Meknès',
];

const CITY_OPTIONS = DEFAULT_CITIES.map((c) => ({ value: c, label: c }));

/* ─── Shared card style ───────────────────────────────────────────────────── */

const cardStyle: React.CSSProperties = { borderRadius: 12, marginBottom: 16 };

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function SettingsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  /* Forms */
  const [generalForm] = Form.useForm<AppSettings>();
  const [pricingForm] = Form.useForm<AppSettings & { minWithdrawalAmount?: number }>();
  const [bookingForm] = Form.useForm<AppSettings>();
  const [geoForm] = Form.useForm<AppSettings>();

  /* Service modal */
  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    editing: ServiceType | null;
  }>({ open: false, editing: null });
  const [serviceForm] = Form.useForm<ServiceType>();

  /* ── Queries ── */

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      apiClient.get('/admin/settings').then((r) => r.data.data as AppSettings),
  });

  const servicesQuery = useQuery({
    queryKey: ['service-types'],
    queryFn: () =>
      apiClient.get('/admin/service-types').then((r) => r.data.data as ServiceType[]),
  });

  /* ── Mutations ── */

  const saveSettingsMutation = useMutation({
    mutationFn: (data: AppSettings) => apiClient.put('/admin/settings', data),
    onSuccess: () => {
      message.success('Paramètres enregistrés');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      message.error('Erreur lors de la sauvegarde');
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/admin/service-types/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
    },
    onError: () => {
      message.error('Erreur lors de la mise à jour du service');
    },
  });

  const saveServiceMutation = useMutation({
    mutationFn: (data: Partial<ServiceType> & { id?: string }) =>
      data.id
        ? apiClient.put(`/admin/service-types/${data.id}`, data)
        : apiClient.post('/admin/service-types', data),
    onSuccess: () => {
      message.success('Service enregistré');
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setServiceModal({ open: false, editing: null });
      serviceForm.resetFields();
    },
    onError: () => {
      message.error('Erreur lors de la sauvegarde du service');
    },
  });

  /* ── Populate forms when settings load ── */

  useEffect(() => {
    const data = settingsQuery.data ?? DEFAULT_SETTINGS;
    generalForm.setFieldsValue(data);
    pricingForm.setFieldsValue(data);
    bookingForm.setFieldsValue(data);
    geoForm.setFieldsValue(data);
  }, [settingsQuery.data, generalForm, pricingForm, bookingForm, geoForm]);

  /* ── Handlers ── */

  const handleSaveGeneral = (values: AppSettings) => {
    const current = settingsQuery.data ?? DEFAULT_SETTINGS;
    saveSettingsMutation.mutate({ ...current, ...values });
  };

  const handleSavePricing = (values: Partial<AppSettings>) => {
    const current = settingsQuery.data ?? DEFAULT_SETTINGS;
    saveSettingsMutation.mutate({ ...current, ...values });
  };

  const handleSaveBooking = (values: Partial<AppSettings>) => {
    const current = settingsQuery.data ?? DEFAULT_SETTINGS;
    saveSettingsMutation.mutate({ ...current, ...values });
  };

  const handleSaveGeo = (values: Partial<AppSettings>) => {
    const current = settingsQuery.data ?? DEFAULT_SETTINGS;
    saveSettingsMutation.mutate({ ...current, ...values });
  };

  const handleOpenAddService = () => {
    serviceForm.resetFields();
    setServiceModal({ open: true, editing: null });
  };

  const handleOpenEditService = (record: ServiceType) => {
    serviceForm.setFieldsValue(record);
    setServiceModal({ open: true, editing: record });
  };

  const handleSaveService = (values: Partial<ServiceType>) => {
    saveServiceMutation.mutate(
      serviceModal.editing
        ? { ...values, id: serviceModal.editing.id }
        : values,
    );
  };

  /* ── Service table columns ── */

  const serviceColumns: ColumnsType<ServiceType> = [
    {
      title: 'Icône',
      key: 'icon',
      width: 60,
      render: (_, r) => <span style={{ fontSize: 22 }}>{r.icon ?? '🏠'}</span>,
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string) => (
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v}
        </div>
      ),
    },
    {
      title: 'Prix base',
      key: 'basePrice',
      width: 120,
      render: (_, r) => `${r.basePrice} MAD/h`,
    },
    {
      title: 'Statut',
      key: 'isActive',
      width: 90,
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          loading={toggleServiceMutation.isPending}
          onChange={() =>
            toggleServiceMutation.mutate({ id: r.id, isActive: !r.isActive })
          }
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => handleOpenEditService(r)}
        />
      ),
    },
  ];

  /* ── Tab items ── */

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined /> Général
        </span>
      ),
      children: (
        <Form form={generalForm} layout="vertical" onFinish={handleSaveGeneral}>
          <Card title="Identité de l'application" style={cardStyle}>
            <Form.Item
              name="appName"
              label="Nom de l'application"
              rules={[{ required: true, message: 'Champ obligatoire' }]}
            >
              <Input placeholder="MenaLink" />
            </Form.Item>
            <Form.Item
              name="supportEmail"
              label="Email de support"
              rules={[{ type: 'email', message: 'Email invalide' }]}
            >
              <Input type="email" placeholder="support@menalink.ma" />
            </Form.Item>
            <Form.Item name="supportPhone" label="Téléphone de support">
              <Input placeholder="+212522000000" />
            </Form.Item>
            <Form.Item name="maintenanceMode" label="Mode maintenance" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="allowNewRegistrations" label="Autoriser les nouvelles inscriptions" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          <Card title="Paiement" style={cardStyle}>
            <Form.Item name="youcanPayApiKey" label="Clé API YouCan Pay">
              <Input.Password placeholder="yk_live_..." />
            </Form.Item>
            <Form.Item name="youcanPayTestMode" label="Mode test" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={saveSettingsMutation.isPending}
            style={{ backgroundColor: '#E8963A' }}
          >
            Enregistrer
          </Button>
        </Form>
      ),
    },
    {
      key: 'pricing',
      label: (
        <span>
          <DollarOutlined /> Tarification
        </span>
      ),
      children: (
        <Form form={pricingForm} layout="vertical" onFinish={handleSavePricing}>
          <Card title="Commissions & Frais" style={cardStyle}>
            <Form.Item
              name="commissionRate"
              label="Taux de commission plateforme"
              help={
                <Text type="secondary">
                  Ex: 15% → prestataire reçoit 85% du montant
                </Text>
              }
            >
              <InputNumber
                min={0}
                max={50}
                step={0.5}
                addonAfter="%"
                style={{ width: 200 }}
              />
            </Form.Item>
            <Form.Item
              name="serviceFee"
              label="Frais de service client (MAD)"
              style={{ marginTop: 16 }}
            >
              <InputNumber min={0} addonAfter="MAD" style={{ width: 200 }} />
            </Form.Item>
          </Card>

          <Card title="Retraits" style={cardStyle}>
            <Form.Item
              name="minWithdrawalAmount"
              label="Montant minimum de retrait"
            >
              <InputNumber min={50} addonAfter="MAD" style={{ width: 200 }} />
            </Form.Item>
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={saveSettingsMutation.isPending}
            style={{ backgroundColor: '#E8963A' }}
          >
            Enregistrer
          </Button>
        </Form>
      ),
    },
    {
      key: 'bookings',
      label: (
        <span>
          <CalendarOutlined /> Réservations
        </span>
      ),
      children: (
        <Form form={bookingForm} layout="vertical" onFinish={handleSaveBooking}>
          <Card title="Délais" style={cardStyle}>
            <Form.Item
              name="cancellationDelayHours"
              label="Délai annulation gratuite"
              help="Au-delà, des frais peuvent s'appliquer"
            >
              <InputNumber
                min={0}
                max={48}
                addonAfter="heures"
                style={{ width: 200 }}
              />
            </Form.Item>
            <Form.Item
              name="acceptanceDelayMinutes"
              label="Délai d'acceptation prestataire"
              style={{ marginTop: 16 }}
              help="Si non accepté dans ce délai, la demande est annulée automatiquement"
            >
              <InputNumber
                min={5}
                max={120}
                addonAfter="minutes"
                style={{ width: 200 }}
              />
            </Form.Item>
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={saveSettingsMutation.isPending}
            style={{ backgroundColor: '#E8963A' }}
          >
            Enregistrer
          </Button>
        </Form>
      ),
    },
    {
      key: 'geography',
      label: (
        <span>
          <EnvironmentOutlined /> Géographie
        </span>
      ),
      children: (
        <Form form={geoForm} layout="vertical" onFinish={handleSaveGeo}>
          <Card title="Zones de service" style={cardStyle}>
            <Form.Item
              name="defaultSearchRadiusKm"
              label="Rayon de recherche par défaut"
            >
              <InputNumber
                min={1}
                max={100}
                addonAfter="km"
                style={{ width: 200 }}
              />
            </Form.Item>
            <Form.Item
              name="availableCities"
              label="Villes desservies"
              style={{ marginTop: 16 }}
            >
              <Select
                mode="tags"
                placeholder="Ajouter une ville..."
                options={CITY_OPTIONS}
                style={{ width: '100%', maxWidth: 480 }}
              />
            </Form.Item>
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={saveSettingsMutation.isPending}
            style={{ backgroundColor: '#E8963A' }}
          >
            Enregistrer
          </Button>
        </Form>
      ),
    },
    {
      key: 'services',
      label: (
        <span>
          <AppstoreOutlined /> Types de services
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddService}
              style={{ backgroundColor: '#E8963A' }}
            >
              Ajouter un service
            </Button>
          </Space>
          <Table<ServiceType>
            columns={serviceColumns}
            dataSource={servicesQuery.data ?? []}
            rowKey="id"
            size="small"
            loading={servicesQuery.isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </div>
      ),
    },
  ];

  /* ── Render ── */

  if (settingsQuery.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>Paramètres</Title>

      <Tabs
        tabPosition="left"
        items={tabItems}
        style={{ minHeight: 500 }}
      />

      {/* ── Add / Edit Service Modal ── */}
      <Modal
        title={serviceModal.editing ? 'Modifier le service' : 'Ajouter un service'}
        open={serviceModal.open}
        onOk={() => serviceForm.submit()}
        onCancel={() => {
          setServiceModal({ open: false, editing: null });
          serviceForm.resetFields();
        }}
        width={520}
        okText={serviceModal.editing ? 'Enregistrer' : 'Ajouter'}
        cancelText="Annuler"
        confirmLoading={saveServiceMutation.isPending}
      >
        <Form
          form={serviceForm}
          layout="vertical"
          onFinish={handleSaveService}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Nom du service"
            rules={[{ required: true, message: 'Champ obligatoire' }]}
          >
            <Input placeholder="Ex: Ménage à domicile" />
          </Form.Item>
          <Form.Item
            name="key"
            label="Identifiant technique"
            rules={[{ required: true, message: 'Champ obligatoire' }]}
          >
            <Input placeholder="Ex: CLEANING" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description du service..." />
          </Form.Item>
          <Form.Item
            name="basePrice"
            label="Prix de base (MAD/h)"
            rules={[{ required: true, message: 'Champ obligatoire' }]}
          >
            <InputNumber min={0} addonAfter="MAD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="icon" label="Icône">
            <Input placeholder="Emoji ou nom d'icône (ex: 🧹)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
