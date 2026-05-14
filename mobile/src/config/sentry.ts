import * as Sentry from '@sentry/react-native';

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
    tracesSampleRate: process.env.EXPO_PUBLIC_ENV === 'production' ? 0.2 : 1.0,
    enableNativeNagger: false,
    integrations: [],
    beforeSend(event) {
      if (event.exception?.values?.[0]?.type === 'Network request failed') {
        event.level = 'warning';
      }
      return event;
    },
  });
}

export { Sentry };
