-- AddColumn next_episode_to_watch_id to user_shows
ALTER TABLE "user_shows" ADD COLUMN "next_episode_to_watch_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user_shows" ADD CONSTRAINT "user_shows_next_episode_to_watch_id_fkey" FOREIGN KEY ("next_episode_to_watch_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "idx_user_shows_next_episode" ON "user_shows"("next_episode_to_watch_id");
