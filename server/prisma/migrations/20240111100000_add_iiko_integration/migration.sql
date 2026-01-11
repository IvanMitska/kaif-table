-- CreateTable
CREATE TABLE "IikoSettings" (
    "id" SERIAL NOT NULL,
    "serverUrl" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IikoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IikoSale" (
    "id" SERIAL NOT NULL,
    "dishId" TEXT NOT NULL,
    "dishName" TEXT NOT NULL,
    "dishCode" TEXT,
    "dishCategory" TEXT NOT NULL,
    "dishCategoryId" TEXT,
    "dishGroup" TEXT,
    "dishGroupId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "discountSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderNum" TEXT NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IikoSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IikoSale_openTime_idx" ON "IikoSale"("openTime");

-- CreateIndex
CREATE INDEX "IikoSale_dishCategory_idx" ON "IikoSale"("dishCategory");

-- CreateIndex
CREATE INDEX "IikoSale_orderNum_idx" ON "IikoSale"("orderNum");
