export const APP_TABS = [
  { name: 'index', href: '/', label: 'Up Next', sf: 'play.circle', md: 'play_circle', icon: 'play-circle-outline' },
  { name: 'discover', href: '/discover', label: 'Discover', sf: 'magnifyingglass', md: 'search', icon: 'search-outline' },
  { name: 'calendar', href: '/calendar', label: 'Calendar', sf: 'calendar', md: 'calendar_month', icon: 'calendar-outline' },
  { name: 'my-shows', href: '/my-shows', label: 'My Shows', sf: 'tv', md: 'live_tv', icon: 'tv-outline' },
  { name: 'profile', href: '/profile', label: 'Profile', sf: 'person.crop.circle', md: 'account_circle', icon: 'person-circle-outline' },
] as const;
