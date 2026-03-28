ALTER TABLE "League"
ADD COLUMN "parentLeagueId" TEXT,
ADD COLUMN "playerRegistrationStatus" TEXT NOT NULL DEFAULT 'CLOSED';

CREATE INDEX "League_parentLeagueId_idx" ON "League"("parentLeagueId");

ALTER TABLE "League"
ADD CONSTRAINT "League_parentLeagueId_fkey"
FOREIGN KEY ("parentLeagueId") REFERENCES "League"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
