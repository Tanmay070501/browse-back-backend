/*
  Warnings:

  - You are about to drop the `TempSesion` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "SessionReplay" ALTER COLUMN "events" DROP DEFAULT;

-- DropTable
DROP TABLE "TempSesion";
