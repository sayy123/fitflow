
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "stripe_session_id",
ADD COLUMN     "mollie_session_id" TEXT;

-- AlterTable
ALTER TABLE "member_subscriptions" DROP COLUMN "stripe_payment_id",
ADD COLUMN     "mollie_payment_id" TEXT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "stripe_account_id",
DROP COLUMN "stripe_account_status",
DROP COLUMN "stripe_charges_enabled",
DROP COLUMN "stripe_customer_id",
DROP COLUMN "stripe_price_id",
DROP COLUMN "stripe_subscription_id",
ADD COLUMN     "mollie_account_id" TEXT,
ADD COLUMN     "mollie_account_status" TEXT DEFAULT 'pending',
ADD COLUMN     "mollie_charges_enabled" BOOLEAN DEFAULT false,
ADD COLUMN     "mollie_customer_id" TEXT,
ADD COLUMN     "mollie_price_id" TEXT,
ADD COLUMN     "mollie_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "studio_members" DROP COLUMN "stripe_customer_id",
ADD COLUMN     "mollie_customer_id" TEXT;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "stripe_customer_id",
DROP COLUMN "stripe_price_id",
DROP COLUMN "stripe_subscription_id",
ADD COLUMN     "mollie_customer_id" VARCHAR(255),
ADD COLUMN     "mollie_price_id" VARCHAR(255),
ADD COLUMN     "mollie_subscription_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_mollie_session_id_key" ON "bookings"("mollie_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_mollie_customer_id_key" ON "organizations"("mollie_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_mollie_subscription_id_key" ON "organizations"("mollie_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_mollie_account_id_key" ON "organizations"("mollie_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_mollie_customer_id_key" ON "user_profiles"("mollie_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_mollie_subscription_id_key" ON "user_profiles"("mollie_subscription_id");

