/*
  Warnings:

  - A unique constraint covering the columns `[membershipNumber]` on the table `member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionPurpose" AS ENUM ('MEMBERSHIP', 'TICKET', 'DONATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED');

-- AlterEnum
ALTER TYPE "MembershipTier" ADD VALUE 'DIAMOND';

-- AlterTable
ALTER TABLE "member" ADD COLUMN     "membershipNumber" TEXT,
ADD COLUMN     "paystackRef" TEXT,
ALTER COLUMN "tier" SET DEFAULT 'SILVER';

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "reference" TEXT NOT NULL,
    "providerTxId" TEXT,
    "purpose" "TransactionPurpose" NOT NULL DEFAULT 'OTHER',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "fees" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "channel" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardBank" TEXT,
    "gatewayResponse" TEXT,
    "ipAddress" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "userId" TEXT,
    "memberId" TEXT,
    "ticketId" TEXT,
    "donationId" TEXT,
    "metadata" JSONB,
    "rawResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_reference_key" ON "transaction"("reference");

-- CreateIndex
CREATE INDEX "transaction_status_idx" ON "transaction"("status");

-- CreateIndex
CREATE INDEX "transaction_purpose_idx" ON "transaction"("purpose");

-- CreateIndex
CREATE INDEX "transaction_userId_idx" ON "transaction"("userId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "member_membershipNumber_key" ON "member"("membershipNumber");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
