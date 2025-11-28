-- CreateIndex
CREATE INDEX "events_date_idx" ON "public"."events"("date");

-- CreateIndex
CREATE INDEX "events_clubId_idx" ON "public"."events"("clubId");

-- CreateIndex
CREATE INDEX "events_title_idx" ON "public"."events"("title");

-- CreateIndex
CREATE INDEX "events_clubId_date_idx" ON "public"."events"("clubId", "date");
