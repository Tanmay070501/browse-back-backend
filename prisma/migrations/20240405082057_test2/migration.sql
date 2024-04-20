/*
  Warnings:

  - The `events` column on the `TempSesion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TempSesion" DROP COLUMN "events",
ADD COLUMN     "events" JSONB[];
