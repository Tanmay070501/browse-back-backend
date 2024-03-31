-- CreateTable
CREATE TABLE "SessionReplay" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "events" JSONB,
    "metadata" JSONB,
    "type" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "projectId" INTEGER,

    CONSTRAINT "SessionReplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionReplay_sessionId_key" ON "SessionReplay"("sessionId");

-- AddForeignKey
ALTER TABLE "SessionReplay" ADD CONSTRAINT "SessionReplay_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
