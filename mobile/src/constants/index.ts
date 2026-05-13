export * from './colors';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Ménage standard',
  DEEP_CLEAN: 'Nettoyage profond',
  MOVE_IN_OUT: 'Entrée / Sortie',
  OFFICE: 'Bureau',
  POST_CONSTRUCTION: 'Post-construction',
};
