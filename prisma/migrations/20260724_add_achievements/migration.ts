import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";

const connectionString = process.env.DATABASE_URL ?? process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("DATABASE_URL or NEON_CONNECTION_STRING is required to run achievements migration.");
}

const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      metric_type TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      icon TEXT,
      icon_kind TEXT NOT NULL DEFAULT 'name',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE achievements
      ADD COLUMN IF NOT EXISTS icon_kind TEXT NOT NULL DEFAULT 'name';

    CREATE TABLE IF NOT EXISTS achievement_tiers (
      id SERIAL PRIMARY KEY,
      achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      required_count INTEGER NOT NULL,
      color_token TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_achievement_tiers_achievement_level UNIQUE (achievement_id, level)
    );

    CREATE TABLE IF NOT EXISTS user_achievement_progress (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      current_tier_id INTEGER REFERENCES achievement_tiers(id) ON DELETE SET NULL,
      current_count INTEGER NOT NULL DEFAULT 0,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      highest_tier_level INTEGER NOT NULL DEFAULT 0,
      unlocked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_user_achievement_progress_user_achievement UNIQUE (user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(active);
    CREATE INDEX IF NOT EXISTS idx_achievements_category_sort ON achievements(category, sort_order);
    CREATE INDEX IF NOT EXISTS idx_achievement_tiers_threshold ON achievement_tiers(achievement_id, required_count);
    CREATE INDEX IF NOT EXISTS idx_user_achievement_progress_user ON user_achievement_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievement_progress_achievement ON user_achievement_progress(achievement_id);
  `);
}

async function seedAchievements() {
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    const upserted = await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: {
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        metricType: achievement.metricType,
        active: true,
        icon: achievement.icon,
        iconKind: achievement.iconKind,
        sortOrder: achievement.sortOrder,
      },
      update: {
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        metricType: achievement.metricType,
        active: true,
        icon: achievement.icon,
        iconKind: achievement.iconKind,
        sortOrder: achievement.sortOrder,
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    for (const tier of achievement.tiers) {
      await prisma.achievementTier.upsert({
        where: {
          achievementId_level: {
            achievementId: upserted.id,
            level: tier.level,
          },
        },
        create: {
          achievementId: upserted.id,
          name: tier.name,
          level: tier.level,
          requiredCount: tier.requiredCount,
          colorToken: tier.colorToken,
        },
        update: {
          name: tier.name,
          requiredCount: tier.requiredCount,
          colorToken: tier.colorToken,
          updatedAt: new Date(),
        },
      });
    }
  }
}

async function main() {
  await ensureTables();
  await seedAchievements();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Achievements migration script completed.");
  })
  .catch(async (error) => {
    console.error("Achievements migration script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
