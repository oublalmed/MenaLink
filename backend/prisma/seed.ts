/**
 * Seed MenaLink — données de test réalistes
 * 5 clients · 8 prestataires · 20 réservations · avis · transactions · notifications
 *
 * Usage : npx tsx prisma/seed.ts
 */

import { PrismaClient, UserRole, UserStatus, ServiceType, BookingStatus, PaymentMethod, PaymentStatus, TransactionType, TransactionStatus, DisputeStatus, WithdrawalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hash = (pw: string): Promise<string> => bcrypt.hash(pw, 10);

function randomDecimal(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// Formate une date en "YYYY-MM-DD" pour scheduled_date
function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Data fixtures ────────────────────────────────────────────────────────────

const CITIES = [
  { city: 'Casablanca', district: 'Maarif',        lat: 33.5992,  lng: -7.6328  },
  { city: 'Casablanca', district: 'Ain Diab',       lat: 33.5896,  lng: -7.6749  },
  { city: 'Casablanca', district: 'Hay Hassani',    lat: 33.5547,  lng: -7.6601  },
  { city: 'Rabat',      district: 'Agdal',          lat: 33.9871,  lng: -6.8519  },
  { city: 'Rabat',      district: 'Souissi',        lat: 33.9999,  lng: -6.8503  },
  { city: 'Marrakech',  district: 'Guéliz',         lat: 31.6295,  lng: -8.0089  },
  { city: 'Fès',        district: 'Ville Nouvelle', lat: 34.0333,  lng: -5.0000  },
  { city: 'Tanger',     district: 'Centre',         lat: 35.7673,  lng: -5.7998  },
];

const CLIENT_FIXTURES = [
  { firstName: 'Samira',   lastName: 'El Idrissi',  email: 'samira.elidrissi@gmail.com',  phone: '+212661001001' },
  { firstName: 'Karim',    lastName: 'Benali',       email: 'karim.benali@outlook.com',    phone: '+212662002002' },
  { firstName: 'Nadia',    lastName: 'Tahiri',       email: 'nadia.tahiri@gmail.com',      phone: '+212663003003' },
  { firstName: 'Youssef',  lastName: 'Rahmouni',     email: 'youssef.rahmouni@yahoo.fr',   phone: '+212664004004' },
  { firstName: 'Fatima',   lastName: 'Ait Brahim',   email: 'fatima.aitbrahim@gmail.com',  phone: '+212665005005' },
];

const PROVIDER_FIXTURES = [
  {
    firstName: 'Khadija',  lastName: 'Moussaoui',   email: 'khadija.moussaoui@gmail.com',   phone: '+212671010001',
    bio: 'Spécialisée dans le ménage standard et le repassage. 5 ans d\'expérience.',
    rateMin: 60,  rateMax: 80,  cityIdx: 0,
    services: [ServiceType.CLEANING, ServiceType.IRONING],
  },
  {
    firstName: 'Hassan',   lastName: 'Berrada',      email: 'hassan.berrada@gmail.com',      phone: '+212671020002',
    bio: 'Expert nettoyage profond et post-construction. Équipement professionnel fourni.',
    rateMin: 90,  rateMax: 130, cityIdx: 1,
    services: [ServiceType.DEEP_CLEANING, ServiceType.POST_CONSTRUCTION],
  },
  {
    firstName: 'Zineb',    lastName: 'Cherkaoui',    email: 'zineb.cherkaoui@gmail.com',     phone: '+212671030003',
    bio: 'Ménage soigné, ponctuelle et de confiance. Disponible weekends.',
    rateMin: 55,  rateMax: 75,  cityIdx: 2,
    services: [ServiceType.CLEANING, ServiceType.IRONING, ServiceType.COOKING],
  },
  {
    firstName: 'Omar',     lastName: 'Alaoui',       email: 'omar.alaoui@gmail.com',         phone: '+212671040004',
    bio: 'Nettoyage de bureaux et espaces professionnels. Discret et efficace.',
    rateMin: 80,  rateMax: 110, cityIdx: 3,
    services: [ServiceType.CLEANING, ServiceType.DEEP_CLEANING],
  },
  {
    firstName: 'Souad',    lastName: 'Mansouri',     email: 'souad.mansouri@gmail.com',      phone: '+212671050005',
    bio: 'Cuisine marocaine traditionnelle et aide ménagère. 8 ans d\'expérience.',
    rateMin: 70,  rateMax: 95,  cityIdx: 4,
    services: [ServiceType.COOKING, ServiceType.CLEANING],
  },
  {
    firstName: 'Rachid',   lastName: 'Khaldi',       email: 'rachid.khaldi@gmail.com',       phone: '+212671060006',
    bio: 'Nettoyage après travaux, spécialisé post-construction.',
    rateMin: 100, rateMax: 150, cityIdx: 5,
    services: [ServiceType.POST_CONSTRUCTION, ServiceType.DEEP_CLEANING],
  },
  {
    firstName: 'Imane',    lastName: 'El Fassi',     email: 'imane.elfassi@gmail.com',       phone: '+212671070007',
    bio: 'Ménage régulier et repassage. Très organisée.',
    rateMin: 50,  rateMax: 70,  cityIdx: 6,
    services: [ServiceType.CLEANING, ServiceType.IRONING],
  },
  {
    firstName: 'Abdelaziz', lastName: 'Tazi',        email: 'abdelaziz.tazi@gmail.com',      phone: '+212671080008',
    bio: 'Multi-services : ménage, cuisine, nettoyage profond.',
    rateMin: 75,  rateMax: 120, cityIdx: 7,
    services: [ServiceType.CLEANING, ServiceType.COOKING, ServiceType.DEEP_CLEANING],
  },
];

const BOOKING_SCENARIOS: Array<{
  clientIdx: number;
  providerIdx: number;
  serviceType: ServiceType;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  daysOffset: number;       // passé < 0, futur > 0
  durationHours: number;
  clientNotes?: string;
  cancellationReason?: string;
  hasReview?: boolean;
  rating?: number;
  hasDispute?: boolean;
}> = [
  // Réservations terminées avec avis
  { clientIdx: 0, providerIdx: 0, serviceType: ServiceType.CLEANING,          status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -20, durationHours: 3,   hasReview: true, rating: 5 },
  { clientIdx: 1, providerIdx: 1, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -15, durationHours: 4,   hasReview: true, rating: 4 },
  { clientIdx: 2, providerIdx: 2, serviceType: ServiceType.IRONING,           status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PAID,    daysOffset: -12, durationHours: 2,   hasReview: true, rating: 5 },
  { clientIdx: 3, providerIdx: 3, serviceType: ServiceType.CLEANING,          status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -10, durationHours: 3,   hasReview: true, rating: 3 },
  { clientIdx: 4, providerIdx: 4, serviceType: ServiceType.COOKING,           status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PAID,    daysOffset: -8,  durationHours: 2.5, hasReview: true, rating: 5 },
  { clientIdx: 0, providerIdx: 5, serviceType: ServiceType.POST_CONSTRUCTION, status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -7,  durationHours: 6,   hasReview: true, rating: 4 },
  { clientIdx: 1, providerIdx: 6, serviceType: ServiceType.CLEANING,          status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PAID,    daysOffset: -5,  durationHours: 3,   hasReview: true, rating: 5 },
  { clientIdx: 2, providerIdx: 7, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.COMPLETED, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -4,  durationHours: 5,   hasReview: true, rating: 4 },

  // En cours aujourd'hui
  { clientIdx: 3, providerIdx: 0, serviceType: ServiceType.CLEANING,          status: BookingStatus.IN_PROGRESS, paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PENDING, daysOffset: 0,   durationHours: 3,   clientNotes: 'Salon et cuisine prioritaires' },
  { clientIdx: 4, providerIdx: 2, serviceType: ServiceType.IRONING,           status: BookingStatus.IN_PROGRESS, paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: 0,   durationHours: 2 },

  // Confirmées (à venir)
  { clientIdx: 0, providerIdx: 3, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.CONFIRMED,   paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: 2,   durationHours: 4,   clientNotes: 'Appartement de 100m2' },
  { clientIdx: 1, providerIdx: 4, serviceType: ServiceType.COOKING,           status: BookingStatus.CONFIRMED,   paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PENDING, daysOffset: 3,   durationHours: 3 },
  { clientIdx: 2, providerIdx: 5, serviceType: ServiceType.POST_CONSTRUCTION, status: BookingStatus.CONFIRMED,   paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: 5,   durationHours: 8,   clientNotes: 'Villa après travaux, 3 étages' },

  // En attente de confirmation
  { clientIdx: 3, providerIdx: 6, serviceType: ServiceType.CLEANING,          status: BookingStatus.PENDING,     paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PENDING, daysOffset: 4,   durationHours: 3 },
  { clientIdx: 4, providerIdx: 7, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.PENDING,     paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PENDING, daysOffset: 6,   durationHours: 5 },
  { clientIdx: 0, providerIdx: 1, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.PENDING,     paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PENDING, daysOffset: 7,   durationHours: 4,   clientNotes: 'Nettoyage complet avant déménagement' },

  // Annulées
  { clientIdx: 1, providerIdx: 2, serviceType: ServiceType.CLEANING,          status: BookingStatus.CANCELLED,   paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PENDING, daysOffset: -18, durationHours: 2,   cancellationReason: 'Empêchement de dernière minute' },
  { clientIdx: 2, providerIdx: 3, serviceType: ServiceType.IRONING,           status: BookingStatus.CANCELLED,   paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.REFUNDED, daysOffset: -9, durationHours: 2,   cancellationReason: 'Prestataire indisponible' },

  // Litige
  { clientIdx: 3, providerIdx: 4, serviceType: ServiceType.DEEP_CLEANING,     status: BookingStatus.DISPUTED,    paymentMethod: PaymentMethod.ONLINE, paymentStatus: PaymentStatus.PAID,    daysOffset: -6,  durationHours: 4,   hasDispute: true },

  // Terminée sans avis
  { clientIdx: 4, providerIdx: 0, serviceType: ServiceType.CLEANING,          status: BookingStatus.COMPLETED,   paymentMethod: PaymentMethod.CASH,   paymentStatus: PaymentStatus.PAID,    daysOffset: -3,  durationHours: 3 },
];

const REVIEW_COMMENTS: Record<number, string[]> = {
  5: [
    'Travail impeccable, la maison brille ! Je recommande vivement.',
    'Très professionnelle, ponctuelle et soigneuse. Je renouvelle.',
    'Excellent travail, dépasse mes attentes. Merci beaucoup !',
    'Parfait du début à la fin. Très satisfaite du résultat.',
    'Prestation de qualité, sérieux et efficace.',
  ],
  4: [
    'Bon travail dans l\'ensemble, quelques petits détails à améliorer.',
    'Satisfait du résultat, je referai appel à ce prestataire.',
    'Bonne prestation, ponctuel et professionnel.',
    'Bien mais pourrait être encore plus minutieux sur certains endroits.',
  ],
  3: [
    'Prestation correcte mais sans plus. Quelques oublis.',
    'Travail moyen, je m\'attendais à mieux pour le prix.',
    'Acceptable mais pas exceptionnel.',
  ],
};

const COMMISSION_RATE = 0.15; // 15%

// ─── Seed principal ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.info('🌱 Démarrage du seed MenaLink...\n');

  // Nettoyage dans l'ordre inverse des dépendances
  await prisma.$transaction([
    prisma.dispute.deleteMany(),
    prisma.withdrawalRequest.deleteMany(),
    prisma.providerEarning.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.review.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.clientAddress.deleteMany(),
    prisma.providerZone.deleteMany(),
    prisma.providerService.deleteMany(),
    prisma.providerProfile.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.appSetting.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.info('✓ Base nettoyée');

  // ── App Settings ────────────────────────────────────────────────────────────
  await prisma.appSetting.createMany({
    data: [
      { key: 'commission_rate',        value: '0.15',   description: 'Taux de commission plateforme (15%)' },
      { key: 'min_booking_hours',      value: '1',      description: 'Durée minimale d\'une réservation (heures)' },
      { key: 'max_booking_hours',      value: '12',     description: 'Durée maximale d\'une réservation (heures)' },
      { key: 'cancellation_delay_h',   value: '24',     description: 'Délai minimum d\'annulation sans frais (heures)' },
      { key: 'withdrawal_min_amount',  value: '100',    description: 'Montant minimum de retrait (MAD)' },
      { key: 'support_phone',          value: '+212522000000', description: 'Numéro de support client' },
      { key: 'support_email',          value: 'support@menalink.ma', description: 'Email de support' },
      { key: 'app_version_min_android', value: '1.0.0', description: 'Version minimale Android requise' },
      { key: 'app_version_min_ios',    value: '1.0.0',  description: 'Version minimale iOS requise' },
    ],
  });
  console.info('✓ App settings créés (9)');

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email:        'admin@menalink.ma',
      phone:        '+212600000000',
      passwordHash: await hash('Admin@2024!'),
      firstName:    'Admin',
      lastName:     'MenaLink',
      role:         UserRole.ADMIN,
      status:       UserStatus.ACTIVE,
      firebaseUid:  'firebase-admin-uid',
    },
  });
  console.info('✓ Admin créé');

  // ── Clients ──────────────────────────────────────────────────────────────────
  const clientUsers = await Promise.all(
    CLIENT_FIXTURES.map(async (c, i) => {
      const user = await prisma.user.create({
        data: {
          email:        c.email,
          phone:        c.phone,
          passwordHash: await hash('Client@2024!'),
          firstName:    c.firstName,
          lastName:     c.lastName,
          role:         UserRole.CLIENT,
          status:       UserStatus.ACTIVE,
          firebaseUid:  `firebase-client-${i + 1}`,
          lastLoginAt:  daysAgo(Math.floor(Math.random() * 5)),
        },
      });

      // Adresse principale
      const city = CITIES[i % CITIES.length];
      await prisma.clientAddress.create({
        data: {
          userId:    user.id,
          label:     'Domicile',
          street:    `${10 + i * 7} Rue ${['Al Qods', 'Mohammed V', 'Hassan II', 'Atlas', 'Lalla Yacout'][i]}`,
          city:      city.city,
          district:  city.district,
          latitude:  city.lat + randomDecimal(-0.01, 0.01, 7),
          longitude: city.lng + randomDecimal(-0.01, 0.01, 7),
          isDefault: true,
        },
      });

      // Deuxième adresse pour certains clients
      if (i < 3) {
        const city2 = CITIES[(i + 2) % CITIES.length];
        await prisma.clientAddress.create({
          data: {
            userId:    user.id,
            label:     'Bureau',
            street:    `${5 + i * 3} Boulevard ${['Zerktouni', 'Anfa', 'Bir Anzarane'][i]}`,
            city:      city2.city,
            district:  city2.district,
            latitude:  city2.lat + randomDecimal(-0.01, 0.01, 7),
            longitude: city2.lng + randomDecimal(-0.01, 0.01, 7),
            isDefault: false,
          },
        });
      }

      return user;
    }),
  );
  console.info(`✓ ${clientUsers.length} clients créés (+ adresses)`);

  // ── Prestataires ─────────────────────────────────────────────────────────────
  const providerUsers: Array<{ user: typeof clientUsers[0]; profileId: string }> = [];

  for (let i = 0; i < PROVIDER_FIXTURES.length; i++) {
    const pf = PROVIDER_FIXTURES[i];
    const cityInfo = CITIES[pf.cityIdx];

    const user = await prisma.user.create({
      data: {
        email:        pf.email,
        phone:        pf.phone,
        passwordHash: await hash('Provider@2024!'),
        firstName:    pf.firstName,
        lastName:     pf.lastName,
        role:         UserRole.PROVIDER,
        status:       UserStatus.ACTIVE,
        firebaseUid:  `firebase-provider-${i + 1}`,
        lastLoginAt:  daysAgo(Math.floor(Math.random() * 3)),
      },
    });

    const profile = await prisma.providerProfile.create({
      data: {
        userId:          user.id,
        bio:             pf.bio,
        hourlyRateMin:   pf.rateMin,
        hourlyRateMax:   pf.rateMax,
        isVerified:      i < 6, // Les 6 premiers sont vérifiés
        verifiedAt:      i < 6 ? daysAgo(30 + i * 5) : null,
        verifiedBy:      i < 6 ? adminUser.id : null,
        cinFrontUrl:     `https://storage.menalink.ma/cin/${user.id}_front.jpg`,
        cinBackUrl:      `https://storage.menalink.ma/cin/${user.id}_back.jpg`,
        portraitUrl:     `https://storage.menalink.ma/portraits/${user.id}.jpg`,
        latitude:        cityInfo.lat + randomDecimal(-0.02, 0.02, 7),
        longitude:       cityInfo.lng + randomDecimal(-0.02, 0.02, 7),
        serviceRadiusKm: [10, 15, 10, 20, 12, 25, 10, 30][i],
        isAvailable:     i !== 7, // Abdelaziz indisponible
        isOnline:        i < 4,
      },
    });

    // Services
    await prisma.providerService.createMany({
      data: pf.services.map((serviceType) => ({
        providerId:   profile.id,
        serviceType,
        pricePerHour: randomDecimal(pf.rateMin, pf.rateMax, 2),
      })),
    });

    // Zones d'intervention
    await prisma.providerZone.createMany({
      data: [
        { providerId: profile.id, city: cityInfo.city, district: cityInfo.district, latitude: cityInfo.lat, longitude: cityInfo.lng },
        { providerId: profile.id, city: CITIES[(pf.cityIdx + 1) % CITIES.length].city, district: CITIES[(pf.cityIdx + 1) % CITIES.length].district },
      ],
    });

    // Compte de revenus
    await prisma.providerEarning.create({
      data: {
        providerId:       profile.id,
        availableBalance: randomDecimal(200, 2000, 2),
        pendingBalance:   randomDecimal(0, 500, 2),
        totalEarned:      randomDecimal(2000, 15000, 2),
        totalWithdrawn:   randomDecimal(500, 5000, 2),
      },
    });

    providerUsers.push({ user, profileId: profile.id });
  }
  console.info(`✓ ${providerUsers.length} prestataires créés (profils · services · zones · revenus)`);

  // ── Réservations ─────────────────────────────────────────────────────────────
  const createdBookings: Array<{ id: string; scenario: typeof BOOKING_SCENARIOS[0]; clientUser: typeof clientUsers[0]; providerUser: typeof clientUsers[0] }> = [];

  for (const scenario of BOOKING_SCENARIOS) {
    const clientUser   = clientUsers[scenario.clientIdx];
    const providerUser = providerUsers[scenario.providerIdx].user;

    // Récupère la première adresse du client
    const address = await prisma.clientAddress.findFirst({
      where: { userId: clientUser.id, isDefault: true },
    });
    if (!address) continue;

    const providerService = await prisma.providerService.findFirst({
      where: { providerId: providerUsers[scenario.providerIdx].profileId, serviceType: scenario.serviceType },
    });
    const pricePerHour = providerService ? Number(providerService.pricePerHour) : 80;

    const totalAmount    = parseFloat((pricePerHour * scenario.durationHours).toFixed(2));
    const commission     = parseFloat((totalAmount * COMMISSION_RATE).toFixed(2));
    const providerAmount = parseFloat((totalAmount - commission).toFixed(2));

    const schedDate   = scenario.daysOffset >= 0 ? daysFromNow(scenario.daysOffset) : daysAgo(Math.abs(scenario.daysOffset));
    const schedHour   = 8 + Math.floor(Math.random() * 8);
    const schedMinute = [0, 30][Math.floor(Math.random() * 2)];
    const schedTime   = `${String(schedHour).padStart(2, '0')}:${String(schedMinute).padStart(2, '0')}`;

    let startedAt: Date | null = null;
    let completedAt: Date | null = null;
    if (scenario.status === BookingStatus.IN_PROGRESS) {
      startedAt = new Date();
    } else if (scenario.status === BookingStatus.COMPLETED) {
      startedAt   = daysAgo(Math.abs(scenario.daysOffset));
      completedAt = new Date(startedAt.getTime() + scenario.durationHours * 3600 * 1000);
    }

    const booking = await prisma.booking.create({
      data: {
        clientId:           clientUser.id,
        providerId:         providerUser.id,
        addressId:          address.id,
        serviceType:        scenario.serviceType,
        status:             scenario.status,
        scheduledDate:      toDateOnly(schedDate),
        scheduledTime:      schedTime,
        durationHours:      scenario.durationHours,
        totalAmount,
        commission,
        providerAmount,
        paymentMethod:      scenario.paymentMethod,
        paymentStatus:      scenario.paymentStatus,
        startedAt,
        completedAt,
        clientNotes:        scenario.clientNotes ?? null,
        cancellationReason: scenario.cancellationReason ?? null,
        createdAt:          daysAgo(Math.abs(scenario.daysOffset) + 1),
      },
    });

    createdBookings.push({ id: booking.id, scenario, clientUser, providerUser });

    // Transaction de paiement
    if (scenario.paymentStatus !== PaymentStatus.PENDING) {
      await prisma.transaction.create({
        data: {
          bookingId:  booking.id,
          userId:     clientUser.id,
          type:       TransactionType.PAYMENT,
          amount:     totalAmount,
          currency:   'MAD',
          status:     scenario.paymentStatus === PaymentStatus.PAID ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
          gatewayRef: scenario.paymentMethod === PaymentMethod.ONLINE
            ? `YCP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
            : null,
          createdAt: daysAgo(Math.abs(scenario.daysOffset) + 1),
        },
      });

      // Commission
      if (scenario.paymentStatus === PaymentStatus.PAID) {
        await prisma.transaction.create({
          data: {
            bookingId: booking.id,
            userId:    providerUser.id,
            type:      TransactionType.COMMISSION,
            amount:    commission,
            currency:  'MAD',
            status:    TransactionStatus.SUCCESS,
            createdAt: daysAgo(Math.abs(scenario.daysOffset)),
          },
        });
      }

      // Remboursement
      if (scenario.paymentStatus === PaymentStatus.REFUNDED) {
        await prisma.transaction.create({
          data: {
            bookingId: booking.id,
            userId:    clientUser.id,
            type:      TransactionType.REFUND,
            amount:    totalAmount,
            currency:  'MAD',
            status:    TransactionStatus.SUCCESS,
            createdAt: daysAgo(Math.abs(scenario.daysOffset) - 1),
          },
        });
      }
    }
  }
  console.info(`✓ ${createdBookings.length} réservations créées (+ transactions)`);

  // ── Avis ─────────────────────────────────────────────────────────────────────
  let reviewCount = 0;
  const ratingAccum: Record<string, { sum: number; count: number }> = {};

  for (const { id: bookingId, scenario, clientUser, providerUser } of createdBookings) {
    if (!scenario.hasReview || !scenario.rating) continue;

    const rating   = scenario.rating;
    const comments = REVIEW_COMMENTS[rating] ?? REVIEW_COMMENTS[3];
    const comment  = comments[Math.floor(Math.random() * comments.length)];

    await prisma.review.create({
      data: {
        bookingId,
        clientId:   clientUser.id,
        providerId: providerUser.id,
        rating,
        comment,
        isPublished: true,
        createdAt:   daysAgo(Math.abs(scenario.daysOffset) - 1),
      },
    });

    if (!ratingAccum[providerUser.id]) ratingAccum[providerUser.id] = { sum: 0, count: 0 };
    ratingAccum[providerUser.id].sum   += rating;
    ratingAccum[providerUser.id].count += 1;
    reviewCount++;
  }

  // Mise à jour des notes moyennes des prestataires
  for (const [userId, { sum, count }] of Object.entries(ratingAccum)) {
    const avg = parseFloat((sum / count).toFixed(2));
    const profile = await prisma.providerProfile.findFirst({ where: { userId } });
    if (profile) {
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data:  { averageRating: avg, totalReviews: count },
      });
    }
  }

  // Mise à jour total missions
  for (const { providerUser, scenario } of createdBookings) {
    if (scenario.status === BookingStatus.COMPLETED) {
      const profile = await prisma.providerProfile.findFirst({ where: { userId: providerUser.id } });
      if (profile) {
        await prisma.providerProfile.update({
          where: { id: profile.id },
          data:  { totalMissions: { increment: 1 } },
        });
      }
    }
  }
  console.info(`✓ ${reviewCount} avis créés (notes moyennes recalculées)`);

  // ── Litiges ──────────────────────────────────────────────────────────────────
  for (const { id: bookingId, scenario, clientUser } of createdBookings) {
    if (!scenario.hasDispute) continue;

    await prisma.dispute.create({
      data: {
        bookingId,
        reportedBy:  clientUser.id,
        assignedTo:  adminUser.id,
        reason:      'Qualité de prestation insatisfaisante',
        description: 'Le nettoyage profond n\'a pas été effectué correctement. Plusieurs zones n\'ont pas été traitées malgré les instructions fournies. Je demande un remboursement partiel.',
        status:      DisputeStatus.UNDER_REVIEW,
        createdAt:   daysAgo(Math.abs(scenario.daysOffset) - 1),
      },
    });
  }
  console.info('✓ 1 litige créé');

  // ── Demandes de retrait ──────────────────────────────────────────────────────
  const ribs = [
    'MA64011519000001205000534921',
    'MA64007780004002001000012345',
    'MA64025790016300000012344500',
  ];

  await prisma.withdrawalRequest.createMany({
    data: [
      {
        providerId:     providerUsers[0].profileId,
        amount:         500,
        bankAccountRib: ribs[0],
        status:         WithdrawalStatus.PROCESSED,
        requestedAt:    daysAgo(10),
        processedAt:    daysAgo(8),
        notes:          'Virement effectué',
      },
      {
        providerId:     providerUsers[1].profileId,
        amount:         1200,
        bankAccountRib: ribs[1],
        status:         WithdrawalStatus.PENDING,
        requestedAt:    daysAgo(2),
      },
      {
        providerId:     providerUsers[2].profileId,
        amount:         300,
        bankAccountRib: ribs[2],
        status:         WithdrawalStatus.REJECTED,
        requestedAt:    daysAgo(15),
        processedAt:    daysAgo(13),
        notes:          'RIB invalide, veuillez soumettre un RIB correct',
      },
    ],
  });
  console.info('✓ 3 demandes de retrait créées');

  // ── Notifications ─────────────────────────────────────────────────────────────
  const notifData: Array<{
    userId: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
  }> = [];

  for (const clientUser of clientUsers) {
    notifData.push({
      userId:  clientUser.id,
      title:   'Bienvenue sur MenaLink !',
      body:    'Trouvez les meilleurs prestataires de ménage près de chez vous.',
      type:    'WELCOME',
      isRead:  true,
    });
  }

  for (const { id: bookingId, scenario, clientUser, providerUser } of createdBookings.slice(0, 8)) {
    notifData.push({
      userId:  clientUser.id,
      title:   'Réservation confirmée',
      body:    `Votre réservation a été confirmée par ${providerUser.firstName}.`,
      type:    'BOOKING_CONFIRMED',
      isRead:  scenario.daysOffset < -7,
    });
    notifData.push({
      userId:  providerUser.id,
      title:   'Nouvelle mission',
      body:    `${clientUser.firstName} a réservé une prestation ${scenario.serviceType.toLowerCase().replace('_', ' ')}.`,
      type:    'BOOKING_NEW',
      isRead:  scenario.daysOffset < -3,
    });
  }

  // Notif de paiement
  notifData.push({
    userId:  clientUsers[0].id,
    title:   'Paiement reçu',
    body:    'Votre paiement de 240 MAD a bien été reçu.',
    type:    'PAYMENT_SUCCESS',
    isRead:  true,
  });

  // Notif litige
  notifData.push({
    userId:  clientUsers[3].id,
    title:   'Litige en cours d\'examen',
    body:    'Notre équipe examine votre litige. Vous serez contacté sous 48h.',
    type:    'DISPUTE_UPDATE',
    isRead:  false,
  });

  await prisma.notification.createMany({ data: notifData });
  console.info(`✓ ${notifData.length} notifications créées`);

  // ── Résumé final ──────────────────────────────────────────────────────────────
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.transaction.count(),
    prisma.notification.count(),
    prisma.dispute.count(),
    prisma.withdrawalRequest.count(),
    prisma.appSetting.count(),
  ]);

  console.info('\n✅ Seed terminé avec succès !\n');
  console.info('📊 Résumé :');
  console.info(`   • Utilisateurs       : ${counts[0]}  (1 admin · ${CLIENT_FIXTURES.length} clients · ${PROVIDER_FIXTURES.length} prestataires)`);
  console.info(`   • Profils prestataires: ${counts[1]}`);
  console.info(`   • Réservations       : ${counts[2]}`);
  console.info(`   • Avis               : ${counts[3]}`);
  console.info(`   • Transactions       : ${counts[4]}`);
  console.info(`   • Notifications      : ${counts[5]}`);
  console.info(`   • Litiges            : ${counts[6]}`);
  console.info(`   • Demandes retrait   : ${counts[7]}`);
  console.info(`   • App settings       : ${counts[8]}`);
  console.info('\n🔑 Comptes de test :');
  console.info('   Admin    → admin@menalink.ma          / Admin@2024!');
  console.info('   Client   → samira.elidrissi@gmail.com / Client@2024!');
  console.info('   Provider → khadija.moussaoui@gmail.com / Provider@2024!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
