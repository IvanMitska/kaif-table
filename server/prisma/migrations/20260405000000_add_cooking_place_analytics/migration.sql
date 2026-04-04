-- Add cooking place and non-cash payment type for extended analytics
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "cookingPlace" TEXT;
ALTER TABLE "IikoSale" ADD COLUMN IF NOT EXISTS "nonCashPaymentType" TEXT;

-- Add index for table analytics
CREATE INDEX IF NOT EXISTS "IikoSale_tableNum_idx" ON "IikoSale"("tableNum");
