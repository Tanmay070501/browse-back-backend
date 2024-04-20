/*
  Warnings:

  - Made the column `events` on table `SessionReplay` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SessionReplay" ALTER COLUMN "events" SET NOT NULL,
ALTER COLUMN "events" SET DEFAULT '[]';

-- CreateTable
CREATE TABLE "TempSesion" (
    "id" INTEGER NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "TempSesion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempSesion_id_key" ON "TempSesion"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TempSesion_sessionId_key" ON "TempSesion"("sessionId");
