-- CreateEnum
CREATE TYPE "Fund" AS ENUM ('OPERATING', 'RESERVE');

-- CreateEnum
CREATE TYPE "TransferDirection" AS ENUM ('TO_RESERVE', 'FROM_RESERVE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "monthlyBudget" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "fund" "Fund" NOT NULL DEFAULT 'OPERATING',
ADD COLUMN     "periodMonth" INTEGER,
ADD COLUMN     "periodYear" INTEGER,
ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT,
    "monthlyFee" DECIMAL(12,2) NOT NULL,
    "duesStartDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundTransfer" (
    "id" TEXT NOT NULL,
    "direction" "TransferDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE INDEX "FundTransfer_date_idx" ON "FundTransfer"("date");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_unitId_periodYear_periodMonth_idx" ON "Transaction"("unitId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_recurringItemId_periodYear_periodMonth_key" ON "Transaction"("recurringItemId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
