# Pilot 2 Finale Mobile

This is the Expo mobile app for Pilot 2 Finale. The goal is to reuse the existing Next.js API and build a native-feeling version of the core TV tracking loop: discover a show, add it to your list, log episodes, and review progress.

## What This Folder Contains

- `src/app`: Expo Router screens. A file here usually becomes a route in the app.
- `src/components`: reusable React Native components.
- `src/constants`: shared values such as theme colors and spacing.
- `src/lib`: app utilities such as the API client.
- `assets`: icons, splash screen assets, and static images bundled with the app.
- `app.json`: Expo app configuration such as name, scheme, icons, and platform settings.

## First-Time Setup

Install dependencies from this folder:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` to the Next.js app URL that the mobile app should call. If this value changes while Expo is running, restart Expo so the new public environment value is bundled into the app.

Common local values:

- Android emulator: `http://10.0.2.2:3000`
- iOS simulator: `http://localhost:3000`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:3000`

If you are testing on both an Android emulator and a physical phone at the same time, prefer your computer's LAN IP, for example `http://192.168.10.111:3000`. The phone cannot use `10.0.2.2`, because that address only has special meaning inside the Android emulator.

The Android package/application ID configured for Play Console is `com.pilot2finale.app`.

## Running The App

Start Expo:

```bash
npm run start
```

Then choose a target from the Expo terminal UI:

- Press `a` for Android.
- Press `i` for iOS on macOS.
- Scan the QR code with Expo Go for a physical device.
- Press `w` for web while developing UI quickly.

## Learning Notes

React Native does not use browser elements like `div`, `button`, or `input`. The usual equivalents are `View`, `Pressable`, and `TextInput`.

Expo Router works like the Next.js App Router in spirit: files inside `src/app` define screens and layouts. The current `_layout.tsx` controls the app shell, while `index.tsx` is the first tab screen.

Environment variables that need to be available in the mobile JavaScript bundle must start with `EXPO_PUBLIC_`.

## Useful Commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

## Current Roadmap

See `../docs/mobileRoadmap.md` for the phased implementation plan.
