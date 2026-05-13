-- ─────────────────────────────────────────────────────────────────────────────
-- Migration initiale MenaLink
-- ─────────────────────────────────────────────────────────────────────────────

-- Enums
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE "ServiceType" AS ENUM ('CLEANING', 'IRONING', 'DEEP_CLEANING', 'POST_CONSTRUCTION', 'COOKING');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'WITHDRAWAL', 'COMMISSION');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "email"         VARCHAR(255) NOT NULL,
    "phone"         VARCHAR(20)  NOT NULL,
    "password_hash" VARCHAR(255),
    "first_name"    VARCHAR(100) NOT NULL,
    "last_name"     VARCHAR(100) NOT NULL,
    "role"          "UserRole"   NOT NULL DEFAULT 'CLIENT',
    "status"        "UserStatus" NOT NULL DEFAULT 'PENDING',
    "avatar_url"    VARCHAR(500),
    "firebase_uid"  VARCHAR(128),
    "fcm_token"     VARCHAR(500),
    "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "last_login_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"       ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key"       ON "users"("phone");
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");
CREATE INDEX "users_role_status_idx"        ON "users"("role", "status");

-- ── provider_profiles ─────────────────────────────────────────────────────────
CREATE TABLE "provider_profiles" (
    "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
    "user_id"           UUID          NOT NULL,
    "bio"               TEXT,
    "hourly_rate_min"   DECIMAL(10,2) NOT NULL,
    "hourly_rate_max"   DECIMAL(10,2) NOT NULL,
    "is_verified"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "verified_at"       TIMESTAMPTZ,
    "verified_by"       UUID,
    "cin_front_url"     VARCHAR(500),
    "cin_back_url"      VARCHAR(500),
    "portrait_url"      VARCHAR(500),
    "average_rating"    DECIMAL(3,2)  NOT NULL DEFAULT 0,
    "total_reviews"     INTEGER       NOT NULL DEFAULT 0,
    "total_missions"    INTEGER       NOT NULL DEFAULT 0,
    "latitude"          DECIMAL(10,7),
    "longitude"         DECIMAL(10,7),
    "service_radius_km" INTEGER       NOT NULL DEFAULT 10,
    "is_available"      BOOLEAN       NOT NULL DEFAULT TRUE,
    "is_online"         BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT "provider_profiles_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "provider_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "hourly_rate_check"         CHECK ("hourly_rate_max" >= "hourly_rate_min"),
    CONSTRAINT "average_rating_check"      CHECK ("average_rating" BETWEEN 0 AND 5)
);

CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");
CREATE INDEX "provider_profiles_available_verified_idx" ON "provider_profiles"("is_available", "is_verified");
CREATE INDEX "provider_profiles_geo_idx"    ON "provider_profiles"("latitude", "longitude");
CREATE INDEX "provider_profiles_rating_idx" ON "provider_profiles"("average_rating" DESC);

-- ── provider_services ─────────────────────────────────────────────────────────
CREATE TABLE "provider_services" (
    "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
    "provider_id"   UUID          NOT NULL,
    "service_type"  "ServiceType" NOT NULL,
    "price_per_hour" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "provider_services_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "provider_services_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "provider_services_price_check"  CHECK ("price_per_hour" > 0)
);

CREATE UNIQUE INDEX "provider_services_provider_type_key" ON "provider_services"("provider_id", "service_type");
CREATE INDEX "provider_services_type_idx" ON "provider_services"("service_type");

-- ── provider_zones ────────────────────────────────────────────────────────────
CREATE TABLE "provider_zones" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID         NOT NULL,
    "city"        VARCHAR(100) NOT NULL,
    "district"    VARCHAR(100),
    "latitude"    DECIMAL(10,7),
    "longitude"   DECIMAL(10,7),

    CONSTRAINT "provider_zones_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "provider_zones_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE
);

CREATE INDEX "provider_zones_provider_idx" ON "provider_zones"("provider_id");
CREATE INDEX "provider_zones_city_idx"     ON "provider_zones"("city");

-- ── client_addresses ──────────────────────────────────────────────────────────
CREATE TABLE "client_addresses" (
    "id"         UUID          NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID          NOT NULL,
    "label"      VARCHAR(100)  NOT NULL,
    "street"     VARCHAR(255)  NOT NULL,
    "city"       VARCHAR(100)  NOT NULL,
    "district"   VARCHAR(100),
    "latitude"   DECIMAL(10,7) NOT NULL,
    "longitude"  DECIMAL(10,7) NOT NULL,
    "is_default" BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT "client_addresses_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "client_addresses_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "client_addresses_user_idx" ON "client_addresses"("user_id");
CREATE INDEX "client_addresses_city_idx" ON "client_addresses"("city");

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE "bookings" (
    "id"                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    "client_id"           UUID            NOT NULL,
    "provider_id"         UUID            NOT NULL,
    "address_id"          UUID            NOT NULL,
    "service_type"        "ServiceType"   NOT NULL,
    "status"              "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_date"      DATE            NOT NULL,
    "scheduled_time"      VARCHAR(5)      NOT NULL,
    "duration_hours"      DECIMAL(4,2)    NOT NULL,
    "total_amount"        DECIMAL(10,2)   NOT NULL,
    "commission"          DECIMAL(10,2)   NOT NULL DEFAULT 0,
    "provider_amount"     DECIMAL(10,2)   NOT NULL,
    "payment_method"      "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payment_status"      "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "started_at"          TIMESTAMPTZ,
    "completed_at"        TIMESTAMPTZ,
    "client_notes"        TEXT,
    "cancellation_reason" TEXT,
    "created_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT "bookings_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "bookings_client_fk"  FOREIGN KEY ("client_id")  REFERENCES "users"("id"),
    CONSTRAINT "bookings_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "users"("id"),
    CONSTRAINT "bookings_address_fk" FOREIGN KEY ("address_id") REFERENCES "client_addresses"("id"),
    CONSTRAINT "bookings_duration_check"  CHECK ("duration_hours" > 0),
    CONSTRAINT "bookings_amount_check"    CHECK ("total_amount" >= 0),
    CONSTRAINT "bookings_commission_check" CHECK ("commission" >= 0),
    CONSTRAINT "bookings_time_format_check" CHECK ("scheduled_time" ~ '^([01]\d|2[0-3]):[0-5]\d$')
);

CREATE INDEX "bookings_client_status_idx"   ON "bookings"("client_id", "status");
CREATE INDEX "bookings_provider_status_idx" ON "bookings"("provider_id", "status");
CREATE INDEX "bookings_scheduled_date_idx"  ON "bookings"("scheduled_date");
CREATE INDEX "bookings_status_payment_idx"  ON "bookings"("status", "payment_status");
CREATE INDEX "bookings_created_at_idx"      ON "bookings"("created_at" DESC);

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE "reviews" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "booking_id"   UUID        NOT NULL,
    "client_id"    UUID        NOT NULL,
    "provider_id"  UUID        NOT NULL,
    "rating"       INTEGER     NOT NULL,
    "comment"      TEXT,
    "is_published" BOOLEAN     NOT NULL DEFAULT TRUE,
    "moderated_at" TIMESTAMPTZ,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "reviews_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "reviews_booking_fk"  FOREIGN KEY ("booking_id")  REFERENCES "bookings"("id") ON DELETE CASCADE,
    CONSTRAINT "reviews_client_fk"   FOREIGN KEY ("client_id")   REFERENCES "users"("id"),
    CONSTRAINT "reviews_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "users"("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "reviews_booking_id_key"       ON "reviews"("booking_id");
CREATE INDEX "reviews_provider_published_idx"      ON "reviews"("provider_id", "is_published");
CREATE INDEX "reviews_client_idx"                  ON "reviews"("client_id");
CREATE INDEX "reviews_rating_idx"                  ON "reviews"("rating");

-- ── transactions ──────────────────────────────────────────────────────────────
CREATE TABLE "transactions" (
    "id"               UUID                NOT NULL DEFAULT gen_random_uuid(),
    "booking_id"       UUID,
    "user_id"          UUID                NOT NULL,
    "type"             "TransactionType"   NOT NULL,
    "amount"           DECIMAL(10,2)       NOT NULL,
    "currency"         VARCHAR(3)          NOT NULL DEFAULT 'MAD',
    "status"           "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_ref"      VARCHAR(255),
    "gateway_response" JSONB,
    "created_at"       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT "transactions_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "transactions_booking_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id"),
    CONSTRAINT "transactions_user_fk"    FOREIGN KEY ("user_id")    REFERENCES "users"("id"),
    CONSTRAINT "transactions_amount_check" CHECK ("amount" > 0)
);

CREATE INDEX "transactions_booking_idx"      ON "transactions"("booking_id");
CREATE INDEX "transactions_user_type_idx"    ON "transactions"("user_id", "type");
CREATE INDEX "transactions_status_date_idx"  ON "transactions"("status", "created_at" DESC);
CREATE INDEX "transactions_gateway_ref_idx"  ON "transactions"("gateway_ref");

-- ── provider_earnings ─────────────────────────────────────────────────────────
CREATE TABLE "provider_earnings" (
    "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
    "provider_id"       UUID          NOT NULL,
    "available_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pending_balance"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_earned"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_withdrawn"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "provider_earnings_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "provider_earnings_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "provider_earnings_available_check" CHECK ("available_balance" >= 0),
    CONSTRAINT "provider_earnings_pending_check"   CHECK ("pending_balance" >= 0)
);

CREATE UNIQUE INDEX "provider_earnings_provider_id_key" ON "provider_earnings"("provider_id");

-- ── withdrawal_requests ───────────────────────────────────────────────────────
CREATE TABLE "withdrawal_requests" (
    "id"               UUID             NOT NULL DEFAULT gen_random_uuid(),
    "provider_id"      UUID             NOT NULL,
    "amount"           DECIMAL(10,2)    NOT NULL,
    "bank_account_rib" VARCHAR(34)      NOT NULL,
    "status"           "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at"     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    "processed_at"     TIMESTAMPTZ,
    "notes"            TEXT,

    CONSTRAINT "withdrawal_requests_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "withdrawal_requests_provider_fk" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "withdrawal_requests_amount_check" CHECK ("amount" > 0)
);

CREATE INDEX "withdrawal_requests_provider_status_idx" ON "withdrawal_requests"("provider_id", "status");
CREATE INDEX "withdrawal_requests_status_date_idx"     ON "withdrawal_requests"("status", "requested_at" DESC);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"    UUID        NOT NULL,
    "title"      VARCHAR(255) NOT NULL,
    "body"       TEXT        NOT NULL,
    "type"       VARCHAR(50) NOT NULL,
    "data"       JSONB,
    "is_read"    BOOLEAN     NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "notifications_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "notifications_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_user_date_idx" ON "notifications"("user_id", "created_at" DESC);

-- ── disputes ──────────────────────────────────────────────────────────────────
CREATE TABLE "disputes" (
    "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
    "booking_id"  UUID           NOT NULL,
    "reported_by" UUID           NOT NULL,
    "assigned_to" UUID,
    "reason"      VARCHAR(255)   NOT NULL,
    "description" TEXT           NOT NULL,
    "status"      "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution"  TEXT,
    "created_at"  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "disputes_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "disputes_booking_fk" FOREIGN KEY ("booking_id")  REFERENCES "bookings"("id"),
    CONSTRAINT "disputes_reporter_fk" FOREIGN KEY ("reported_by") REFERENCES "users"("id"),
    CONSTRAINT "disputes_assignee_fk" FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "disputes_booking_id_key"   ON "disputes"("booking_id");
CREATE INDEX "disputes_status_date_idx"         ON "disputes"("status", "created_at" DESC);
CREATE INDEX "disputes_reported_by_idx"         ON "disputes"("reported_by");
CREATE INDEX "disputes_assigned_to_idx"         ON "disputes"("assigned_to");

-- ── app_settings ──────────────────────────────────────────────────────────────
CREATE TABLE "app_settings" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "key"         VARCHAR(100) NOT NULL,
    "value"       TEXT         NOT NULL,
    "description" TEXT,
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- ── Trigger updated_at auto ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON "bookings"
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
