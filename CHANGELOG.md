# Changelog

All notable changes to MenaLink are documented in this file.

Format: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## [Unreleased]

### Added
- Sentry error tracking (backend + mobile)
- Prometheus metrics endpoint (`GET /metrics`)
- Alerting middleware for error rate > 1% and latency > 500ms
- Swagger/OpenAPI 3.0 documentation (`GET /api/docs`)
- Enhanced health check with DB status, uptime, version
- GitHub Actions CI/CD (backend, mobile, admin)
- Docker multi-stage build for backend (< 200 Mo)
- Railway deployment configuration (`railway.json`)
- Expo EAS configuration (`eas.json`) with development/staging/production profiles
- OTA updates via Expo EAS Update
- k6 load test scripts (target: p95 < 300ms @ 100 concurrent users)
- Security tests: SQL injection, XSS, rate limiting validation
- Integration tests for all API routes (Supertest)
- Unit tests for all services (coverage > 80%)
- Mobile component tests (React Native Testing Library)
- Mobile store tests (Zustand)
- Mobile hook tests (React Query)

## [1.0.0] — 2024-05

### Added

#### Backend
- Authentication: register client/provider, login, social (Google/Apple), JWT refresh, OTP phone verification
- Booking management: CRUD, status machine (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED)
- Payment integration: YouCan Pay checkout + webhook handler
- Earnings & withdrawals: provider revenue tracking, 15% commission, withdrawal requests
- Reviews: post-booking rating system with moderation
- Admin API: users management, provider verification (CIN), dispute resolution, analytics
- Firebase Admin SDK: FCM push notifications (single, multicast, topic)
- SMS service: PointSMS (primary) + Twilio (fallback), OTP & booking notifications
- Email service: Nodemailer SMTP with 7 HTML templates
- File upload: Cloudinary (primary) + S3 (fallback), sharp image optimization
- Scheduler: hourly booking reminders, 5-min auto-decline, daily recap at 08:00
- Structured logging: Winston with daily rotation (14d app / 30d errors)

#### Mobile (React Native + Expo)
- Auth flow: login, register, social auth, OTP verification
- Client screens: Home, Search, Booking, Tracking, Payments, Reviews, Profile, Chat
- Provider screens: Dashboard, Requests (accept/decline), Calendar, Active Mission, Earnings, Withdrawal, Profile, Chat
- Firebase RTDB: real-time chat, GPS tracking, typing indicators
- Google Maps: provider search map, distance matrix, directions
- React Query v5: all API calls with optimistic updates
- Zustand stores: auth, bookings, search, provider, earnings, missions
- Expo Haptics, Reanimated 2 animations, react-native-svg

#### Admin (React + Ant Design 5)
- Dashboard: KPI cards + Recharts charts (line, stacked bar, donut pie)
- Users: clients list (Excel export) + providers list (CIN verification modal)
- Bookings: table + Ant Design Calendar view
- Payments: stats + BarChart + transactions/withdrawals tabs
- Disputes: table + drawer detail + resolution modal
- Settings: services CRUD, commission rate, notifications, security, maintenance mode
