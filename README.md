# MenaLink — Plateforme de Services à Domicile

MenaLink est une marketplace connectant les clients marocains aux prestataires de services à domicile (nettoyage, plomberie, électricité, peinture, jardinage, déménagement).

## Stack Technique

| Couche | Technologie |
|---|---|
| Backend API | Node.js 20 + Express + TypeScript + Prisma |
| Base de données | PostgreSQL 16 |
| Mobile | React Native 0.73 (Expo SDK 50) |
| Admin | React 18 + Ant Design 5 + Vite |
| Auth | Firebase Auth + JWT |
| Temps réel | Firebase RTDB |
| Paiement | YouCan Pay |
| SMS | PointSMS + Twilio (fallback) |
| Email | Nodemailer SMTP |
| Upload | Cloudinary + AWS S3 (fallback) |
| Maps | Google Maps APIs |
| CI/CD | GitHub Actions |
| Déploiement | Railway (backend) + Expo EAS (mobile) |
| Monitoring | Sentry + Prometheus + Winston |

## Prérequis

- Node.js >= 20
- PostgreSQL >= 16
- Docker (optionnel)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/oublalmed/MenaLink.git
cd MenaLink
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos variables
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

L'API est disponible sur `http://localhost:4000`.
La documentation Swagger est sur `http://localhost:4000/api/docs`.

### 3. Mobile

```bash
cd mobile
cp .env.example .env
# Éditer .env avec vos variables
npm install
npx expo start
```

### 4. Admin

```bash
cd admin
npm install
npm run dev
```

L'admin est disponible sur `http://localhost:5173`.

## Variables d'environnement

Voir [`backend/.env.example`](./backend/.env.example) et [`mobile/.env.example`](./mobile/.env.example) pour la liste complète.

Les variables obligatoires pour démarrer en développement :

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET` | Secret JWT (min 32 chars) |
| `FIREBASE_PROJECT_ID` | ID projet Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email service account Firebase |
| `FIREBASE_PRIVATE_KEY` | Clé privée Firebase |

## Commandes

### Backend

```bash
npm run dev              # Démarrer en mode dev (tsx watch)
npm run build            # Compiler TypeScript
npm run test             # Tous les tests
npm run test:unit        # Tests unitaires uniquement
npm run test:e2e         # Tests d'intégration
npm run test:coverage    # Rapport coverage HTML
npm run test:security    # Tests de sécurité
npm run prisma:migrate   # Appliquer migrations
npm run prisma:studio    # Interface Prisma Studio
npm run prisma:seed      # Seed base de données
```

### Mobile

```bash
npx expo start           # Démarrer Metro bundler
npx expo start --android # Sur émulateur Android
npx expo start --ios     # Sur simulateur iOS
npm test                 # Tests Jest
eas build --platform android --profile development  # Build dev Android
eas build --platform ios --profile development      # Build dev iOS
```

### Tests de charge (k6)

```bash
# Installer k6 : https://k6.io/docs/getting-started/installation/
k6 run k6/load-test.js -e API_URL=http://localhost:4000
k6 run k6/auth-load-test.js -e API_URL=http://localhost:4000
```

## Architecture

```
MenaLink/
├── backend/               # API REST Node.js
│   ├── src/
│   │   ├── config/        # Firebase, Prisma, Swagger, Sentry
│   │   ├── controllers/   # Handlers HTTP
│   │   ├── middleware/    # Auth, validation, métriques, alertes
│   │   ├── routes/        # Définitions des routes
│   │   ├── schemas/       # Validation Zod
│   │   ├── services/      # Logique métier
│   │   └── utils/         # Logger, helpers
│   ├── prisma/            # Schéma + migrations + seed
│   └── src/__tests__/     # Tests unitaires, intégration, sécurité
├── mobile/                # App React Native (Expo)
│   └── src/
│       ├── components/    # Atoms, Molecules, Organisms
│       ├── hooks/         # React Query hooks
│       ├── navigation/    # React Navigation
│       ├── screens/       # Écrans client et prestataire
│       ├── services/      # Firebase, Maps, API client
│       └── store/         # Zustand stores
├── admin/                 # Back-office React + Ant Design
│   └── src/
│       ├── components/    # Layout, composants réutilisables
│       ├── pages/         # 7 pages admin
│       ├── services/      # API client axios
│       └── store/         # Zustand admin auth
└── k6/                    # Scripts de tests de charge
```

## Déploiement

### Backend — Railway

```bash
# Déploiement staging (branch staging)
git push origin staging

# Déploiement production (tag version)
git tag v1.0.0 && git push origin v1.0.0
```

Le Dockerfile multi-stage produit une image < 200 Mo.
Variables d'environnement à configurer dans le dashboard Railway.

### Mobile — Expo EAS

```bash
# Build staging
eas build --platform all --profile staging

# Build production
eas build --platform all --profile production

# Mise à jour OTA (sans republier sur les stores)
eas update --branch production --message "Hotfix v1.0.1"

# Soumettre aux stores (après tag version dans CI)
eas submit --platform all --latest
```

## Monitoring

| Endpoint | Description |
|---|---|
| `GET /health` | État API, DB, uptime, version |
| `GET /metrics` | Métriques Prometheus |
| `GET /api/docs` | Swagger UI (dev uniquement) |

Sentry capture automatiquement toutes les erreurs non gérées.
Les alertes Winston se déclenchent si :
- Taux d'erreur 5xx > 1% sur une fenêtre de 60s
- Latence > 500ms pour une requête

## Licence

Propriétaire — © 2024 MenaLink. Tous droits réservés.
