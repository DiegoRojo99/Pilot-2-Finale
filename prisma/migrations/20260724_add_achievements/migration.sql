-- CreateTable "achievements"
CREATE TABLE IF NOT EXISTS "achievements" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "icon_kind" TEXT NOT NULL DEFAULT 'name',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable "achievement_tiers"
CREATE TABLE IF NOT EXISTS "achievement_tiers" (
    "id" SERIAL NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "required_count" INTEGER NOT NULL,
    "color_token" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable "user_achievement_progress"
CREATE TABLE IF NOT EXISTS "user_achievement_progress" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "current_tier_id" INTEGER,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "highest_tier_level" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievement_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_achievements_active" ON "achievements"("active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_achievements_category_sort" ON "achievements"("category", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_achievement_tiers_achievement_level" ON "achievement_tiers"("achievement_id", "level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_achievement_tiers_threshold" ON "achievement_tiers"("achievement_id", "required_count");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_achievement_progress_user_achievement" ON "user_achievement_progress"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_achievement_progress_user" ON "user_achievement_progress"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_achievement_progress_achievement" ON "user_achievement_progress"("achievement_id");

-- AddForeignKey (only if not already present)
DO $$ BEGIN
    ALTER TABLE "achievement_tiers" ADD CONSTRAINT "achievement_tiers_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (only if not already present)
DO $$ BEGIN
    ALTER TABLE "user_achievement_progress" ADD CONSTRAINT "user_achievement_progress_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (only if not already present)
DO $$ BEGIN
    ALTER TABLE "user_achievement_progress" ADD CONSTRAINT "user_achievement_progress_current_tier_id_fkey" FOREIGN KEY ("current_tier_id") REFERENCES "achievement_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
