-- DropForeignKey
ALTER TABLE "ticket" DROP CONSTRAINT "ticket_userId_fkey";

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "checkedInCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "holdExpiresAt" TIMESTAMP(3),
ADD COLUMN     "holderEmail" TEXT,
ADD COLUMN     "holderName" TEXT,
ADD COLUMN     "tierId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "fulfilledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "device_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_organizer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "gate" TEXT,
    "deviceId" TEXT,
    "scannedById" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConflict" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "check_in_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_token_token_key" ON "device_token"("token");

-- CreateIndex
CREATE INDEX "device_token_userId_idx" ON "device_token"("userId");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "event_organizer_userId_idx" ON "event_organizer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_organizer_eventId_userId_key" ON "event_organizer"("eventId", "userId");

-- CreateIndex
CREATE INDEX "check_in_ticketId_idx" ON "check_in"("ticketId");

-- CreateIndex
CREATE INDEX "check_in_eventId_idx" ON "check_in"("eventId");

-- CreateIndex
CREATE INDEX "ticket_eventId_status_idx" ON "ticket"("eventId", "status");

-- CreateIndex
CREATE INDEX "ticket_tierId_status_idx" ON "ticket"("tierId", "status");

-- CreateIndex
CREATE INDEX "ticket_userId_idx" ON "ticket"("userId");

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "event_ticket_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_organizer" ADD CONSTRAINT "event_organizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_organizer" ADD CONSTRAINT "event_organizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Membership numbers come from a database sequence, so two members can never
-- be given the same number. The old numbering counted active members, which
-- could repeat a number after a member expired. The sequence continues from
-- the highest number already issued.
CREATE SEQUENCE "membership_number_seq";

SELECT setval(
  'membership_number_seq',
  COALESCE(
    (
      SELECT MAX(CAST(SPLIT_PART("membershipNumber", '-', 3) AS INTEGER))
      FROM "member"
      WHERE "membershipNumber" ~ '^YIF-[0-9]{4}-[0-9]+$'
    ),
    0
  ) + 1,
  false
);
