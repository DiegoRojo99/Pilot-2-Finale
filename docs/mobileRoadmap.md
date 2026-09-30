# Mobile App Roadmap

Pilot 2 Finale already has a mobile-first web experience and a fresh Expo app under `mobile/`. This roadmap turns that starter into a real companion app that uses the existing Next.js API, auth, Prisma-backed data, and TMDB catalog features.

## Guiding Goals

- Keep the mobile app focused on fast daily episode tracking.
- Reuse the existing API contracts before inventing new backend paths.
- Ship an MVP with core tracking flows before polishing advanced views.
- Keep web and mobile data behavior consistent: authenticated, user-scoped, and resilient to network failures.
- Treat iOS and Android as first-class targets from the start, with web support optional for development convenience.

## Phase 0: Foundation And Decisions

Status: mostly complete (waiting on production decisions)

Purpose: confirm the app architecture before feature work begins.

Tasks:

- [x] Use Expo for the mobile app foundation.
- [x] Use Expo Go for early development.
- [ ] Move to development builds before adding native-only features.
- [x] Target Android and iOS for MVP.
- [x] Decide how local mobile devices reach the API during development.
- [x] Add `EXPO_PUBLIC_API_BASE_URL` conventions for API base URLs.
- [x] Add an Expo config fallback for the API base URL.
- [ ] Decide the production API URL for mobile builds.
- [ ] Confirm whether mobile auth can use the current `/api/auth/*` proxy directly.
- [ ] Confirm whether Neon Auth supports provider-side account deletion from the app/backend.
- [x] Reuse the existing dark TV-tracker visual direction.
- [x] Document required local setup in `mobile/README.md`.

Acceptance Checks:

- [x] A developer can run the Expo app and point it at a working API environment.
- [ ] The team has a final written answer for auth, production API base URL, and target platforms.

## Phase 1: Mobile App Skeleton

Status: complete

Purpose: replace starter screens with the real product structure.

Tasks:

- [x] Brand the Expo app as Pilot 2 Finale in `app.json`.
- [x] Set the Android package name for Google Play.
- [x] Replace the default tab structure with product tabs.
- [x] Set up Expo Router routes for the core tabs:
	- [x] Discover
	- [x] My Shows
	- [x] History
	- [x] Stats
	- [x] Profile
- [x] Move tab routes into a route group.
- [x] Add root stack navigation for detail screens.
- [x] Add navigation patterns for show detail screens.
- [x] Add navigation patterns for episode detail screens.
- [x] Add a reusable native theme layer for colors, spacing, typography, and surfaces.
- [x] Align mobile colors with the web slate/cyan/rose palette.
- [x] Add a mobile API client wrapper with typed request/response handling.
- [x] Move API response types into `mobile/src/types`.
- [x] Split feature API calls out of the common API client.
- [x] Add placeholder screens for unfinished tabs.
- [x] Remove or archive remaining default Expo starter content.
- [x] Replace remaining starter assets with Pilot 2 Finale assets.
- [x] Add a reusable screen container component.
- [x] Add common button and icon button components.
- [x] Add common empty state, list row, badge, card, form field, and modal/sheet components.
- [x] Add shared skeleton components instead of one-off skeleton styles.
- [x] Review tab icons and labels on Android, iOS, and web.

Acceptance Checks:

- [x] The app launches into real product navigation instead of template screens.
- [x] Empty states exist for each top-level route.
- [x] Loading and error states exist for each real data route.
- [x] API calls can be made from mobile with consistent error formatting.

## Phase 2: Authentication And Session Handling

Status: complete

Purpose: make the mobile app usable with real user accounts.

Tasks:

- [x] Confirm mobile-compatible Neon Auth flow on emulator and physical phone.
- [x] Decide whether auth uses web redirects, API proxy calls, or a mobile-specific flow.
- [x] Implement sign in screen matching the existing auth model.
- [x] Implement registration screen matching the existing auth model.
- [x] Persist session state securely on device.
- [x] Add session bootstrap on app launch.
- [x] Protect authenticated routes.
- [x] Redirect unauthenticated users to auth screens.
- [x] Add sign out from the profile screen.
- [x] Handle expired sessions gracefully.
- [x] Handle failed refreshes gracefully.
- [x] Handle offline startup gracefully.
- [x] Add auth cookies to mobile API requests for user-scoped endpoints.
- [x] Verify API requests send the required auth state for user-scoped endpoints on device.
- [x] Add mobile account deletion request UI after auth is connected.

Acceptance Checks:

- [x] A user can register, sign in, close the app, reopen it, and remain signed in on device.
- [x] Authenticated API routes return only the signed-in user's data.
- [x] Signing out clears local session state and protected data from the UI.

## Phase 3: Discover And Add Shows

Status: in progress

Purpose: let users find TV shows and add them to their tracker.

Tasks:

- [x] Build the Discover screen using the existing search endpoint.
- [x] Build the Discover screen using the existing trending endpoint.
- [x] Build the Discover screen using the existing top-rated endpoint.
- [x] Add debounced search with cancellation-safe loading states.
- [x] Display TMDB posters, names, dates, ratings, and overview snippets in native list/card layouts.
- [x] Add horizontal suggestion rails for trending and top-rated shows.
- [x] Add rail heading icons using the app accent color.
- [x] Extract Discover result cards into reusable components.
- [x] Extract poster rails into reusable components.
- [x] Extract TMDB image/date helpers into reusable utilities.
- [x] Add show detail navigation from search results.
- [x] Add show detail navigation from trending and top-rated results.
- [x] Redesign search bar and remove landing page text.
- [x] Add see all navigation from trending and top-rated results.
- [x] Add empty state for searches that return zero results.
- [x] Add retry action for failed search requests.
- [x] Add pull-to-refresh or manual refresh for suggestion rails.
- [x] Show whether a result is already in the user's tracker.
- [x] Add shows to `want_to_watch` by default, matching the web behavior.
- [ ] Cache discovery responses long enough to avoid wasteful repeat requests.
- [ ] Consider replacing `ScrollView` result lists with `FlatList` if lists become large.

Acceptance Checks:

- [x] Users can search TMDB shows from mobile.
- [ ] Users can add a show once and see duplicate/add-disabled state afterward.
- [ ] Discovery still works when the personal library request fails, with a clear degraded state.

## Phase 4: My Shows And Status Management

Status: complete

Purpose: make the personal library useful for daily tracking.

Tasks:

- [x] Add mobile API functions for `/api/my-shows`.
- [x] Add mobile API functions for `/api/my-shows/:tmdbId`.
- [x] Build the My Shows screen with status filters.
- [x] Add filters for Watching, Want to Watch, Watched, On Hold, and Dropped.
- [x] Render show cards with poster and title.
- [x] Render current status on show cards.
- [x] Render progress summary on show cards.
- [x] Render next episode when available.
- [x] Support updating a show's status from mobile.
- [x] Support removing a show from the user's tracker.
- [x] Add pull-to-refresh for library views.
- [x] Add optimistic updates for status changes where safe.
- [x] Keep behavior consistent with existing `/api/my-shows` routes.

Acceptance Checks:

- [x] Users can view each status bucket on mobile.
- [x] Status changes persist and are reflected after refresh.
- [x] Deleting a show removes it from the current list without leaking stale data.

## Phase 5: Show Detail And Episode Logging

Status: mostly complete

Purpose: deliver the core tracking workflow.

Tasks:

- [x] Build a native show detail screen with metadata.
- [x] Add full-width backdrop treatment with bottom fade.
- [x] Add poster, title, year, rating, season count, and episode count.
- [x] Add genres.
- [x] Add overview section.
- [x] Fetch show details from the existing show endpoint.
- [x] Display season summaries from show details.
- [x] Match the web season row style with episode counts, progress bar, and chevron.
- [x] Fetch season data from the existing season endpoint when a season expands.
- [x] Display read-only episode rows inside expanded seasons.
- [x] Add episode still images to episode rows.
- [x] Format episode air dates like `Mar 8, 2024`.
- [x] Add episode detail navigation.
- [x] Build a read-only episode detail screen.
- [x] Add skeleton loading state for show detail.
- [x] Add skeleton loading state for episode detail.
- [ ] Extract show detail hero into a reusable component.
- [ ] Extract episode detail hero into a reusable component if it grows.
- [x] Add mobile API functions for episode logs.
- [x] Fetch episode logs for the selected show.
- [x] Replace placeholder `0/n` season progress with real watched counts.
- [x] Show watched/unwatched state on episode rows.
- [x] Add status controls to the show detail screen.
- [x] Build an episode logging flow with watched date.
- [x] Add optional episode rating.
- [x] Add optional episode notes.
- [x] Support editing an existing episode log.
- [x] Support deleting an episode log.
- [x] Add clear progress feedback after logging an episode.
- [ ] Trigger or consume catalog sync behavior when next-episode data is missing.

Acceptance Checks:

- [x] Users can browse show details from mobile.
- [x] Users can expand seasons and view episode rows from mobile.
- [x] Users can open episode detail screens from mobile.
- [x] Users can log, edit, and delete an episode from mobile.
- [x] Episode progress matches the web app after refresh.
- [x] The next unwatched episode resolves correctly for active shows.

## Phase 6: Unreleased Episodes & Release Calendar

Status: complete

Purpose: gracefully handle unreleased, future-dated, and catalog-gap edge cases; surface upcoming releases as a key feature.

Tasks:

- [x] Add backend logic to tag episodes as unreleased (air date in future or missing).
- [x] Filter out unreleased episodes from watchable episode lists on show detail.
- [x] Show visual indicator (e.g., "Coming Soon") on unreleased episodes instead of checkbox.
- [x] Filter "My Shows" tab to only display released episodes as next.
- [x] Update +N count to only include released episodes.
- [x] Build a "Coming Soon" tab on WatchingPage showing upcoming episode releases.
- [x] Group upcoming episodes by air date with diary-style section headers.
- [x] Show episode metadata: show name, season, episode number, title, air date.
- [x] Create PATCH /api/my-shows endpoint to refresh stale database cached values.
- [x] Handle seasons with zero fetched episodes (incomplete catalog data).
- [x] Display message like "Season data not yet available" when season episodes are missing.
- [x] Handle TMDB catalog refreshes that add new episode data mid-season.

Acceptance Checks:

- [x] Users cannot accidentally log episodes with future air dates.
- [x] My Shows tab displays only released episodes as next.
- [x] Coming Soon tab shows all unreleased episodes grouped by air date.
- [x] Users can refresh stale data via PATCH endpoint when database values are outdated.
- [x] Shows with missing or incomplete season data display a clear message.
- [x] Next episode data updates correctly after catalog refresh.

## Phase 7: Diary

Status: complete (web), in progress (mobile)

Purpose: bring the existing insight surfaces to mobile after core tracking works.

Tasks:

- [x] Add mobile API function for chronological episode logs.
- [x] Build the History screen using chronological episode logs.
- [x] Add filters or grouping if the existing data shape supports it cleanly.
- [x] Add helpful empty states for new users with no logs yet.
- [x] Add a calendar view to view logs by date (web)
- [ ] Add a calendar view to view logs by date (mobile)

Acceptance Checks:

- [x] Recently watched episodes appear correctly on mobile.
- [x] Calendar view shows dates with episode logs and counts.
- [x] Clicking a date filters the list to show only episodes from that day.
- [ ] Achievements load and represent current user progress.

## Phase 8: Stats And Achievements

Status: in progress

Purpose: bring the existing insight surfaces to mobile after core tracking works.

Tasks:

- [x] Add mobile API function for `/api/episodes/stats`.
- [x] Build the Stats screen using `/api/episodes/stats` and related app data.
- [x] Build graph trend line for watched episodes.
- [ ] Build a genre breakdown pie chart.
- [ ] Add mobile API function for `/api/achievements`.
- [ ] Build the Achievements screen using `/api/achievements`.
- [x] Add helpful empty states for new users with no logs yet.
- [x] Keep stats compact and glanceable for phone screens.

Acceptance Checks:

- [x] Stats match the web app for the same account.
- [ ] Achievements load and represent current user progress.

## Phase 9: Efficiency Improvements

Status: not started

Purpose: optimize core workflows to ensure diary updates and episode logging feel responsive and snappy on real devices.

Tasks:

- [ ] Profile diary update flow (editing watched date, rating, and notes).
- [ ] Profile episode logging flow (capturing initial log on show detail).
- [ ] Identify bottlenecks: form rendering, date picker, rating slider, API calls, state updates.
- [ ] Optimize date picker performance (lazy load or memoize date selection components).
- [ ] Optimize rating slider re-renders (memoize callbacks, debounce value changes if needed).
- [ ] Implement optimistic updates for diary edits (update UI before server confirms).
- [ ] Implement optimistic updates for episode logs (update watched state before server confirms).
- [ ] Cache episode data aggressively to avoid redundant fetches during logging workflows.
- [ ] Use React Query mutation batching for bulk episode operations.
- [ ] Debounce text input (notes) to reduce re-renders during typing.
- [ ] Add loading indicators and disable buttons during mutations to prevent double-submission.
- [ ] Profile show detail and season expansion performance with large season lists.
- [ ] Consider virtualizing long episode lists if needed (FlatList instead of ScrollView).
- [ ] Add performance metrics or analytics to track diary/logging user experience.

Acceptance Checks:

- [ ] Diary update flow completes visibly within 1-2 seconds on average devices.
- [ ] Episode logging from show detail feels snappy (no noticeable lag in UI response).
- [ ] Optimistic updates reduce perceived latency and improve user confidence.
- [ ] Large watchlists and long episode lists scroll smoothly without frame drops.

## Phase 10: Mobile Quality Pass

Status: not started

Purpose: make the app feel reliable and native before beta.

Tasks:

- [ ] Add app-wide offline and poor-network handling.
- [ ] Add retry patterns for failed read requests.
- [ ] Add retry patterns for failed mutations.
- [ ] Review accessibility labels.
- [ ] Review touch targets.
- [ ] Review contrast.
- [ ] Review dynamic text behavior.
- [ ] Review screen reader order.
- [ ] Tune Discover performance with realistic result counts.
- [ ] Tune library performance for large watchlists.
- [ ] Tune history performance for long episode histories.
- [x] Add skeleton placeholders for show detail loading.
- [x] Add skeleton placeholders for episode detail loading.
- [ ] Add skeleton placeholders for Discover suggestions/search.
- [ ] Add skeleton placeholders for My Shows, History, Stats, and Profile.
- [ ] Polish keyboard behavior on auth, search, rating, and notes flows.
- [ ] Add platform-specific checks for Android back behavior.
- [ ] Add platform-specific checks for iOS safe areas.
- [ ] Add basic error reporting strategy.
- [ ] Add notifications or reminders for upcoming episodes.

Acceptance Checks:

- [ ] Core flows remain usable on slow network conditions.
- [ ] Lists scroll smoothly with realistic account data.
- [ ] Key interactive elements meet mobile touch target expectations.

## Phase 11: Testing And Release Readiness

Status: not started

Purpose: prepare the mobile app for real users.

Tasks:

- [x] Add mobile typecheck command usage to the development workflow.
- [x] Configure app name.
- [x] Configure Android package name.
- [ ] Fix existing starter lint issues or remove starter files.
- [ ] Add lint/typecheck commands to CI if CI exists.
- [ ] Add unit tests for API client helpers.
- [ ] Add unit tests for auth state.
- [ ] Add unit tests for data mappers.
- [ ] Add integration or component tests for auth.
- [ ] Add integration or component tests for search.
- [ ] Add integration or component tests for add show.
- [ ] Add integration or component tests for status update.
- [ ] Add integration or component tests for episode logging.
- [ ] Create development build for Android.
- [ ] Create development build for iOS.
- [ ] Configure final app icon assets.
- [ ] Configure final splash screen assets.
- [ ] Configure iOS bundle identifier.
- [ ] Define release channels: development, preview/beta, production.
- [ ] Configure EAS Build if app store distribution is planned.
- [ ] Configure EAS Submit if app store distribution is planned.
- [ ] Write a release checklist for environment variables, API URL, migrations, and smoke tests.

Acceptance Checks:

- [ ] A development build can be installed on a real device.
- [ ] Release configuration is documented and reproducible.
- [ ] The MVP has a smoke-test checklist covering auth, discovery, library, and episode logging.

## Phase 12: Post-MVP Enhancements

Status: backlog

Purpose: improve the app after the core product is validated.

Tasks:

- [ ] Push notifications for reminders, new seasons, or continue-watching prompts.
- [ ] Home screen widgets or quick actions for logging the next episode.
- [ ] Offline queue for episode logs and status changes.
- [ ] Deep links for shows and shared recommendations.
- [ ] Better stats: streaks, trends, genre breakdowns, and completion velocity.
- [ ] Native share cards for watched episodes or achievements.
- [ ] Admin/catalog refresh visibility for maintainers if needed on mobile.

## Cross-Cutting Workstreams

These run alongside feature phases when they become relevant.

- [ ] API contract stability: keep mobile request/response types aligned with `types/` and `lib/api.ts`.
- [ ] Data security: verify every mobile-accessed endpoint remains user-scoped server-side.
- [ ] Performance: cache read-heavy discovery data and avoid duplicate show/episode fetches.
- [ ] Observability: log actionable mobile failures without exposing personal data.
- [ ] Design consistency: keep navigation, status labels, rating displays, and empty states aligned with the web app.
- [ ] Documentation: update setup docs whenever auth, env vars, build commands, or release steps change.

## Suggested MVP Scope

The first usable mobile beta should include:

- [x] Sign in, register, and sign out.
- [x] Discover with search, trending, top-rated, and add-to-tracker.
- [x] My Shows with status filters and status updates.
- [x] Show detail with episode list and episode logging.
- [x] History and basic stats.
- [ ] Device install through development or preview builds.

Achievements, advanced stats, notifications, offline queueing, and app store release can follow after the main tracking loop feels solid.
