-- Remove redundant columns from UserShow (data is fetched from Show table via relation)
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "name";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "poster_path";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "backdrop_path";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "overview";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "first_air_date";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "vote_average";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "number_of_seasons";
ALTER TABLE "user_shows" DROP COLUMN IF EXISTS "number_of_episodes";
