# Mobile App Roadmap

Pilot 2 Finale already has a mobile-first web experience and a fresh Expo app under `mobile/`. This roadmap turns that starter into a real companion app that uses the existing Next.js API, auth, Prisma-backed data, and TMDB catalog features.

## Guiding Goals

- Keep the mobile app focused on fast daily episode tracking.
- Reuse the existing API contracts before inventing new backend paths.
- Ship an MVP with core tracking flows before polishing advanced views.
- Keep web and mobile data behavior consistent: authenticated, user-scoped, and resilient to network failures.
- Treat iOS and Android as first-class targets from the start, with web support optional for development convenience.

## Phase 0: Foundation And Decisions

Status: not started

Purpose: confirm the app architecture before feature work begins.

Tasks:

- Decide the mobile runtime strategy: Expo Go for early development, then development builds before native-only features.
- Define supported platforms for MVP: Android, iOS, or both.
- Decide how the mobile app reaches the API in each environment: local dev server, LAN device, emulator, preview, production.
- Add mobile environment variable conventions for API base URLs.
- Confirm whether mobile auth should use the current `/api/auth/*` proxy directly or a mobile-specific auth flow.
- Decide the minimum visual direction for mobile: reuse current dark TV-tracker style or introduce a dedicated native theme.
- Document required local setup for contributors in `mobile/README.md`.

Acceptance Checks:

- A developer can run the Expo app and point it at a working API environment.
- The team has a written answer for auth, API base URL, and target platforms.

## Phase 1: Mobile App Skeleton

Status: not started

Purpose: replace starter screens with the real product structure.

Tasks:

- Remove or archive the default Expo starter content.
- Create the main app shell with safe-area handling, status bar behavior, and loading/error states.
- Set up Expo Router routes for the core tabs:
	- Discover
	- My Shows
	- History
	- Stats
	- Profile
- Add a reusable native theme layer for colors, spacing, typography, and surfaces.
- Add common UI primitives: screen container, buttons, icon buttons, empty states, list rows, badges, cards, form fields, and modals/sheets.
- Add navigation patterns for show detail and episode detail screens.
- Add a mobile API client wrapper with typed request/response handling.

Acceptance Checks:

- The app launches into real product navigation instead of template screens.
- Empty, loading, and error states exist for each top-level route.
- API calls can be made from mobile with consistent error formatting.

## Phase 2: Authentication And Session Handling

Status: not started

Purpose: make the mobile app usable with real user accounts.

Tasks:

- Implement sign in and registration screens matching the existing auth model.
- Persist session state securely on device.
- Add session bootstrap on app launch.
- Protect authenticated routes and redirect unauthenticated users to auth screens.
- Add sign out from the profile screen.
- Handle expired sessions, failed refreshes, and offline startup gracefully.
- Verify API requests send the required auth state for user-scoped endpoints.

Acceptance Checks:

- A user can register, sign in, close the app, reopen it, and remain signed in.
- Authenticated API routes return only the signed-in user's data.
- Signing out clears local session state and protected data from the UI.

## Phase 3: Discover And Add Shows

Status: not started

Purpose: let users find TV shows and add them to their tracker.

Tasks:

- Build the Discover screen using the existing search, trending, and top-rated endpoints.
- Add debounced search with cancellation-safe loading states.
- Display TMDB posters, names, dates, ratings, and overview snippets in native list/card layouts.
- Show whether a result is already in the user's tracker.
- Add shows to `want_to_watch` by default, matching the web behavior.
- Add show detail navigation from search, trending, and top-rated results.
- Cache discovery responses long enough to avoid wasteful repeat requests.

Acceptance Checks:

- Users can search TMDB shows from mobile.
- Users can add a show once and see duplicate/add-disabled state afterward.
- Discovery still works when the personal library request fails, with a clear degraded state.

## Phase 4: My Shows And Status Management

Status: not started

Purpose: make the personal library useful for daily tracking.

Tasks:

- Build the My Shows screen with status filters: Watching, Want to Watch, Watched, On Hold, Dropped.
- Render show cards with poster, title, current status, progress summary, and next episode when available.
- Support updating a show's status from mobile.
- Support removing a show from the user's tracker.
- Add pull-to-refresh for library views.
- Add optimistic updates for status changes where safe.
- Keep behavior consistent with existing `/api/my-shows` routes.

Acceptance Checks:

- Users can view each status bucket on mobile.
- Status changes persist and are reflected after refresh.
- Deleting a show removes it from the current list without leaking stale data.

## Phase 5: Show Detail And Episode Logging

Status: not started

Purpose: deliver the core tracking workflow.

Tasks:

- Build a native show detail screen with metadata, status controls, seasons, and episode progress.
- Fetch show details and season data from the existing show endpoints.
- Fetch episode logs for the selected show.
- Build an episode logging flow with watched date, optional rating, and optional notes.
- Support editing an existing episode log.
- Support deleting an episode log.
- Add clear progress feedback after logging an episode.
- Trigger or consume catalog sync behavior when next-episode data is missing.

Acceptance Checks:

- Users can log, edit, and delete an episode from mobile.
- Episode progress matches the web app after refresh.
- The next unwatched episode resolves correctly for active shows.

## Phase 6: History, Stats, And Achievements

Status: not started

Purpose: bring the existing insight surfaces to mobile after core tracking works.

Tasks:

- Build the History screen using chronological episode logs.
- Add filters or grouping if the existing data shape supports it cleanly.
- Build the Stats screen using `/api/episodes/stats` and related app data.
- Build the Achievements screen using `/api/achievements`.
- Add helpful empty states for new users with no logs yet.
- Keep stats compact and glanceable for phone screens.

Acceptance Checks:

- Recently watched episodes appear correctly on mobile.
- Stats match the web app for the same account.
- Achievements load and represent current user progress.

## Phase 7: Mobile Quality Pass

Status: not started

Purpose: make the app feel reliable and native before beta.

Tasks:

- Add app-wide offline and poor-network handling.
- Add retry patterns for failed mutations.
- Review accessibility: labels, touch targets, contrast, dynamic text, and screen reader order.
- Tune list performance for large libraries and long episode histories.
- Add skeletons or lightweight placeholders for slow data.
- Polish keyboard behavior on auth, search, rating, and notes flows.
- Add platform-specific checks for Android back behavior and iOS safe areas.
- Add basic error reporting strategy.

Acceptance Checks:

- Core flows remain usable on slow network conditions.
- Lists scroll smoothly with realistic account data.
- Key interactive elements meet mobile touch target expectations.

## Phase 8: Testing And Release Readiness

Status: not started

Purpose: prepare the mobile app for real users.

Tasks:

- Add lint/typecheck commands to the mobile workflow and run them in CI if CI exists.
- Add unit tests for API client helpers, auth state, and data mappers.
- Add integration or component tests for auth, search, add show, status update, and episode logging flows.
- Create development builds for Android and iOS.
- Configure app icons, splash screen, app name, and bundle identifiers.
- Define release channels: development, preview/beta, production.
- Configure EAS Build and EAS Submit if app store distribution is planned.
- Write a release checklist for environment variables, API URL, migrations, and smoke tests.

Acceptance Checks:

- A development build can be installed on a real device.
- Release configuration is documented and reproducible.
- The MVP has a smoke-test checklist covering auth, discovery, library, and episode logging.

## Phase 9: Post-MVP Enhancements

Status: backlog

Purpose: improve the app after the core product is validated.

Tasks:

- Push notifications for reminders, new seasons, or continue-watching prompts.
- Home screen widgets or quick actions for logging the next episode.
- Offline queue for episode logs and status changes.
- Deep links for shows and shared recommendations.
- Better stats: streaks, trends, genre breakdowns, and completion velocity.
- Native share cards for watched episodes or achievements.
- Admin/catalog refresh visibility for maintainers if needed on mobile.

## Cross-Cutting Workstreams

These run alongside feature phases when they become relevant.

- API contract stability: keep mobile request/response types aligned with `types/` and `lib/api.ts`.
- Data security: verify every mobile-accessed endpoint remains user-scoped server-side.
- Performance: cache read-heavy discovery data and avoid duplicate show/episode fetches.
- Observability: log actionable mobile failures without exposing personal data.
- Design consistency: keep navigation, status labels, rating displays, and empty states aligned with the web app.
- Documentation: update setup docs whenever auth, env vars, build commands, or release steps change.

## Suggested MVP Scope

The first usable mobile beta should include:

- Sign in, register, and sign out.
- Discover with search, trending, top-rated, and add-to-tracker.
- My Shows with status filters and status updates.
- Show detail with episode list and episode logging.
- History and basic stats.
- Device install through development or preview builds.

Achievements, advanced stats, notifications, offline queueing, and app store release can follow after the main tracking loop feels solid.
