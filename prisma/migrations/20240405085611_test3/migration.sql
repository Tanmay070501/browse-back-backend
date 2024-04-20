/*
  Warnings:

  - Changed the type of `events` on the `TempSesion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "TempSesion" DROP COLUMN "events",
ADD COLUMN     "events" JSONB NOT NULL;
