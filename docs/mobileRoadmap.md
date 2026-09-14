# Mobile App Roadmap

Pilot 2 Finale already has a mobile-first web experience and a fresh Expo app under `mobile/`. This roadmap turns that starter into a real companion app that uses the existing Next.js API, auth, Prisma-backed data, and TMDB catalog features.

## Guiding Goals

- Keep the mobile app focused on fast daily episode tracking.
- Reuse the existing API contracts before inventing new backend paths.
- Ship an MVP with core tracking flows before polishing advanced views.
- Keep web and mobile data behavior consistent: authenticated, user-scoped, and resilient to network failures.
- Treat iOS and Android as first-class targets from the start, with web support optional for development convenience.

## Phase 0: Foundation And Decisions

Status: in progress

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

Status: in progress

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
- [ ] Remove or archive remaining default Expo starter content.
- [ ] Replace remaining starter assets with Pilot 2 Finale assets.
- [ ] Add a reusable screen container component.
- [ ] Add common button and icon button components.
- [ ] Add common empty state, list row, badge, card, form field, and modal/sheet components.
- [ ] Add shared skeleton components instead of one-off skeleton styles.
- [ ] Review tab icons and labels on Android, iOS, and web.

Acceptance Checks:

- [x] The app launches into real product navigation instead of template screens.
- [x] Empty states exist for each top-level route.
- [ ] Loading and error states exist for each real data route.
- [x] API calls can be made from mobile with consistent error formatting.

## Phase 2: Authentication And Session Handling

Status: not started

Purpose: make the mobile app usable with real user accounts.

Tasks:

- [ ] Confirm mobile-compatible Neon Auth flow.
- [ ] Decide whether auth uses web redirects, API proxy calls, or a mobile-specific flow.
- [ ] Implement sign in screen matching the existing auth model.
- [ ] Implement registration screen matching the existing auth model.
- [ ] Persist session state securely on device.
- [ ] Add session bootstrap on app launch.
- [ ] Protect authenticated routes.
- [ ] Redirect unauthenticated users to auth screens.
- [ ] Add sign out from the profile screen.
- [ ] Handle expired sessions gracefully.
- [ ] Handle failed refreshes gracefully.
- [ ] Handle offline startup gracefully.
- [ ] Verify API requests send the required auth state for user-scoped endpoints.
- [ ] Add mobile account deletion request UI after auth is connected.

Acceptance Checks:

- [ ] A user can register, sign in, close the app, reopen it, and remain signed in.
- [ ] Authenticated API routes return only the signed-in user's data.
- [ ] Signing out clears local session state and protected data from the UI.

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
- [ ] Add empty state for searches that return zero results.
- [ ] Add retry action for failed search requests.
- [ ] Add pull-to-refresh or manual refresh for suggestion rails.
- [ ] Show whether a result is already in the user's tracker.
- [ ] Add shows to `want_to_watch` by default, matching the web behavior.
- [ ] Cache discovery responses long enough to avoid wasteful repeat requests.
- [ ] Consider replacing `ScrollView` result lists with `FlatList` if lists become large.

Acceptance Checks:

- [x] Users can search TMDB shows from mobile.
- [ ] Users can add a show once and see duplicate/add-disabled state afterward.
- [ ] Discovery still works when the personal library request fails, with a clear degraded state.

## Phase 4: My Shows And Status Management

Status: not started

Purpose: make the personal library useful for daily tracking.

Tasks:

- [ ] Add mobile API functions for `/api/my-shows`.
- [ ] Add mobile API functions for `/api/my-shows/:tmdbId`.
- [ ] Build the My Shows screen with status filters.
- [ ] Add filters for Watching, Want to Watch, Watched, On Hold, and Dropped.
- [ ] Render show cards with poster and title.
- [ ] Render current status on show cards.
- [ ] Render progress summary on show cards.
- [ ] Render next episode when available.
- [ ] Support updating a show's status from mobile.
- [ ] Support removing a show from the user's tracker.
- [ ] Add pull-to-refresh for library views.
- [ ] Add optimistic updates for status changes where safe.
- [ ] Keep behavior consistent with existing `/api/my-shows` routes.

Acceptance Checks:

- [ ] Users can view each status bucket on mobile.
- [ ] Status changes persist and are reflected after refresh.
- [ ] Deleting a show removes it from the current list without leaking stale data.

## Phase 5: Show Detail And Episode Logging

Status: in progress

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
- [ ] Add mobile API functions for episode logs.
- [ ] Fetch episode logs for the selected show.
- [ ] Replace placeholder `0/n` season progress with real watched counts.
- [ ] Show watched/unwatched state on episode rows.
- [ ] Add status controls to the show detail screen.
- [ ] Build an episode logging flow with watched date.
- [ ] Add optional episode rating.
- [ ] Add optional episode notes.
- [ ] Support editing an existing episode log.
- [ ] Support deleting an episode log.
- [ ] Add clear progress feedback after logging an episode.
- [ ] Trigger or consume catalog sync behavior when next-episode data is missing.

Acceptance Checks:

- [x] Users can browse show details from mobile.
- [x] Users can expand seasons and view episode rows from mobile.
- [x] Users can open episode detail screens from mobile.
- [ ] Users can log, edit, and delete an episode from mobile.
- [ ] Episode progress matches the web app after refresh.
- [ ] The next unwatched episode resolves correctly for active shows.

## Phase 6: History, Stats, And Achievements

Status: not started

Purpose: bring the existing insight surfaces to mobile after core tracking works.

Tasks:

- [ ] Add mobile API function for chronological episode logs.
- [ ] Build the History screen using chronological episode logs.
- [ ] Add filters or grouping if the existing data shape supports it cleanly.
- [ ] Add mobile API function for `/api/episodes/stats`.
- [ ] Build the Stats screen using `/api/episodes/stats` and related app data.
- [ ] Add mobile API function for `/api/achievements`.
- [ ] Build the Achievements screen using `/api/achievements`.
- [ ] Add helpful empty states for new users with no logs yet.
- [ ] Keep stats compact and glanceable for phone screens.

Acceptance Checks:

- [ ] Recently watched episodes appear correctly on mobile.
- [ ] Stats match the web app for the same account.
- [ ] Achievements load and represent current user progress.

## Phase 7: Mobile Quality Pass

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

Acceptance Checks:

- [ ] Core flows remain usable on slow network conditions.
- [ ] Lists scroll smoothly with realistic account data.
- [ ] Key interactive elements meet mobile touch target expectations.

## Phase 8: Testing And Release Readiness

Status: not started

Purpose: prepare the mobile app for real users.

Tasks:

- [x] Add mobile typecheck command usage to the development workflow.
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
- [x] Configure app name.
- [x] Configure Android package name.
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

## Phase 9: Post-MVP Enhancements

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

- [ ] Sign in, register, and sign out.
- [ ] Discover with search, trending, top-rated, and add-to-tracker.
- [ ] My Shows with status filters and status updates.
- [ ] Show detail with episode list and episode logging.
- [ ] History and basic stats.
- [ ] Device install through development or preview builds.

Achievements, advanced stats, notifications, offline queueing, and app store release can follow after the main tracking loop feels solid.
