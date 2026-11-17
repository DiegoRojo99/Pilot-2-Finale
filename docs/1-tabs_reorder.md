# Mobile Tab Restructure

## Goal

Make the mobile app's navigation clearer and more polished without losing existing tracking features. Target tab order:

1. **Up Next** — the next episode to watch for shows marked Watching.
2. **Discover** — the existing search and discovery experience.
3. **Calendar** — upcoming air dates for tracked shows.
4. **My Shows** — the library, focused on shows and their progress.
5. **Profile** — account and settings, with access to Stats.

Up Next is about the next episode the user can watch; Calendar is about future air dates. The existing Diary calendar instead shows episodes the user has already logged.

## Starting point before migration

- The mobile tabs are Discover, My Shows, Diary, Stats, and Profile; Discover is currently the index route.
- My Shows defaults to Watching and displays next-episode cards with a logging action. Its Coming Soon subtab lists upcoming episodes grouped by air date, rather than displaying a calendar grid.
- Diary and Stats are currently top-level tabs. Profile already contains account settings and a link to Achievements.
- The mobile upcoming-episodes request currently filters to Watching. The endpoint returns cached episodes with known future air dates; it does not necessarily include every future episode.

## Decisions

- [x] Calendar includes all tracked show statuses.
- [x] Diary remains accessible from Profile.
- [x] Up Next keeps Watching shows without a reliable next episode and explains that they may be caught up or have unavailable data.
- [x] Calendar uses a horizontally scrollable day strip with a date-grouped episode agenda. Tapping a day jumps to its section without filtering other dates out.
- [x] My Shows opens on Watching; progress must not imply certainty when counts are incomplete.

## 1. Navigation and migration

- [x] Define routes and labels for the five tabs in the agreed order, with Up Next as the initial tab.
- [ ] Update both native and mobile-web tab implementations, including consistent icons, selected states, and accessibility labels.
- [x] Move Stats and Diary out of the tab bar while keeping both reachable; add a clear Profile entry for Stats and an agreed entry for Diary.
- [ ] Preserve or redirect existing routes and update internal links, including Diary detail/back navigation. Check deep links and navigation history so existing entry points do not lead to broken screens.
- [ ] Keep authentication gates and sign-in navigation working on the reorganized screens.

## 2. Up Next

- [x] Extract the current My Shows next-episode experience into Up Next and restrict its main list to Watching shows.
- [x] Keep show-detail navigation and the existing quick episode-logging flow, including date and rating.
- [x] Refresh the next episode and progress after logging and when returning from changes on another screen.
- [x] Provide loading, empty, error/retry, and refresh states; avoid labeling unavailable episode data as completed.

## 3. Discover

- [x] Move Discover to the second tab without changing its search, suggestions, show-detail navigation, or add-to-library behavior.
- [ ] Verify navigation to trending and top-rated screens and returning to Discover.

## 4. Calendar

- [x] Extract Coming Soon from My Shows into the Calendar tab; reuse the existing upcoming-episodes API where it meets the agreed requirements.
- [x] Present upcoming episodes by air date in the chosen calendar/agenda layout, with show name and episode identification, and navigation to relevant details.
- [x] Replace the month grid with a day strip and date-grouped cards showing episode artwork, show name, season, and episode.
- [x] Apply the agreed show-status scope and handle multiple episodes on one date, date boundaries, and missing or unknown air dates explicitly.
- [ ] Check whether catalog synchronization and API data cover the desired date range; document any limitations or make targeted API changes if needed.
- [x] Add independent loading, empty, error/retry, and refresh states; do not present request failures as an empty calendar.

## 5. My Shows

- [x] Replace next-episode-heavy cards with a compact show-focused library view showing poster, title, metadata, status, and watching progress.
- [x] Keep the existing status filters and access to show details and status management.
- [x] Show year, genres, season count, and a status-colored badge. For in-progress shows with known counts, show the next episode and watched/total percentage with a matching bar; hide the entire progress section at 0% and 100%.
- [x] Put All first in the status filters, keep Watching selected by default, and show counts beside each filter.
- [x] Refresh library progress and status after changes elsewhere; provide loading, empty, error/retry, and refresh states.

## 6. Profile, Stats, and Diary

- [x] Add a Profile section or row that opens the existing Stats screen, with a back path.
- [x] Add the agreed Diary entry point and preserve existing viewing, editing, and detail navigation.
- [x] Retain Profile's account, achievements, theme, privacy, and sign-out flows.

## 7. Polish and verification

- [ ] Apply the existing mobile design system consistently across tabs and cards; check readable text, contrast, touch targets, safe areas, and light/dark themes.
- [ ] Test the complete flow: discover and add a show, view it in My Shows and Up Next, log an episode, and verify updated progress, Diary, and Stats.
- [ ] Test Calendar with multiple dates, no upcoming episodes, differing show statuses, and API errors; verify air-date behavior across time zones.
- [ ] Test signed-out, expired-session, loading, empty, offline/error, refresh, and return-to-screen behavior.
- [ ] Verify tab order, initial route, back navigation, and deep links on Android, iOS, and mobile web.
- [ ] Run the relevant mobile lint/type checks and focused tests; add tests for changed navigation and data behavior where practical.
- [x] Update the mobile roadmap and relevant navigation documentation after implementation.

## Progress

Checked implementation tasks reflect completed code; the separate verification tasks remain open. The Calendar day-strip redesign passes targeted lint, mobile/server type checks, date-grouping and air-date tests, and a web export. Broader lint previously reported an existing error in Diary and existing warnings; interactive and device verification remains outstanding.