-- CreateIndex
CREATE INDEX "events_clubId_idx" ON "events"("clubId");

-- CreateIndex
CREATE INDEX "events_recurringEventId_idx" ON "events"("recurringEventId");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "recurring_events_clubId_idx" ON "recurring_events"("clubId");

-- CreateIndex
CREATE INDEX "recurring_events_isActive_idx" ON "recurring_events"("isActive");
