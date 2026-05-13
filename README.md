# MenaLink — Application de gestion de services de ménage

Application mobile full-stack de réservation et gestion de services de ménage à domicile.

## Stack technique

| Couche | Technologie |
|---|---|
| Mobile | React Native + Expo SDK 50+ |
| Backend | Node.js + Express.js |
| Base de données | PostgreSQL via Prisma ORM |
| Temps réel | Firebase Realtime Database |
| Auth | Firebase Authentication |
| Notifications | Firebase Cloud Messaging (FCM) |
| Paiement | YouCan Pay API |
| Géolocalisation | Google Maps SDK |
| Admin web | React.js + Ant Design 5 |
| Hébergement | Railway (backend) + Expo EAS (mobile) |

## Structure du projet

```
MenaLink/
├── mobile/     # Application React Native Expo (clients & prestataires)
├── backend/    # API REST Node.js + Express
├── admin/      # Back-office React.js + Ant Design
└── shared/     # Types & constantes TypeScript partagés
```

## Prérequis

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 15
- Expo CLI : `npm install -g expo-cli eas-cli`
- Compte Firebase (Auth, Realtime DB, FCM)
- Compte YouCan Pay (paiements)
- Clé API Google Maps

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/oublalmed/menalink.git
cd MenaLink

# 2. Backend
cd backend && cp .env.example .env  # remplir les variables
npm install
npx prisma migrate dev
npm run dev

# 3. Mobile
cd ../mobile && cp .env.example .env
npm install
npx expo start

# 4. Admin
cd ../admin && cp .env.example .env
npm install
npm run dev
```

## Palette de couleurs

```ts
const COLORS = {
  primary:    '#2980B9',
  dark:       '#2C3E50',
  success:    '#27AE60',
  warning:    '#E67E22',
  danger:     '#E74C3C',
  gray:       '#7F8C8D',
  lightGray:  '#F4F6F7',
  white:      '#FFFFFF',
  background: '#F0F4F8',
}
```

## Conventions de code

- TypeScript strict sur tous les projets
- ESLint + Prettier
- Commits en français : `feat:`, `fix:`, `refactor:`
- camelCase pour variables/fonctions, PascalCase pour composants, UPPER_SNAKE_CASE pour constantes
- Validation des inputs avec Zod
- Commentaires JSDoc sur toutes les fonctions publiques
