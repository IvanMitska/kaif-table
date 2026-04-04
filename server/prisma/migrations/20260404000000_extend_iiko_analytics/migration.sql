-- Add extended analytics fields to IikoSale
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "waiterId" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "waiterName" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "paymentType" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "orderType" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "tableNum" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "guestCount" INTEGER;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "closeTime" TIMESTAMP(3);
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "discountType" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "sessionNum" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "productCost" DOUBLE PRECISION;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IikoSale_waiterId_idx" ON "IikoSale"("waiterId");
CREATE INDEX IF NOT EXISTS "IikoSale_paymentType_idx" ON "IikoSale"("paymentType");
