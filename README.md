# ReKindle

A cross-platform mobile app (iOS + Android) that acts as a donor's pre-trip assistant. Scan items, get an AI verdict, see local demand, schedule a drop-off, and track your impact.

Contributors: Adi, Shreyas, Ajay, Joe, Jason

## What it does

- **Scan** items with your camera — Gemini 3.0 Preview classifies them as Resell or Recycle.
- **Triage** — approved items get routed to the best nearby Goodwill location; redirected items get pointed to the right partner (e-waste, textile recycler, etc.).
- **Heatmap** — see which nearby locations need what, card-based list.
- **Schedule** drop-offs at a time slot that works for you.
- **Dashboard** — track total items donated, lbs diverted, CO2 saved, and resale value generated.

## Tech stack

- Expo (React Native) + expo-router
- Gemini 3.0 Preview for image analysis
- Supabase for data (locations, demand, donations, schedules)
- Google Maps for directions

## Prerequisites

- Node.js 18+ and npm
- An Expo account (optional, for device testing)
- The Expo Go app on your phone, or an iOS simulator / Android emulator
- API keys for:
  - Google Gemini (`@google/genai`)
  - Supabase (URL + anon key)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <this-repo>
   cd ReKindle
   npm install
   ```

2. Add your API keys. Create a `.env` file in the project root (or set the env vars however you normally do):

   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Seed Supabase with the four tables the app expects: `locations`, `demand`, `scans_history`, `profiles`. Insert 3–5 real Goodwill locations near your demo venue.

## Running the app

Start the dev server:

```bash
npm start
```

Then pick a target:

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # web preview
```

Or scan the QR code in the terminal with the Expo Go app on a physical device. **For camera features, use a real device — simulators have limited camera support.**

## Using the app

1. **Open the app.** You'll land on the home tab.
2. **Tap Scan.** The camera opens. Point at an item and tap the white circle to capture a photo. You can capture multiple photos for a bundle. Tap **Finish** to send them to Gemini. Tap **← Back** in the top-left corner to leave the scanner without scanning.
3. **Review the verdict.** You'll see the item, category, a Resell/Recycle badge, estimated resale value, and a prep tip. From here you can:
   - **Confirm & Save** — logs the scan and takes you to the Impact dashboard.
   - **Override** — flip the decision if Gemini got it wrong (earns bonus points).
   - **Cancel / Rescan** — dismiss the card and start over.
4. **Map tab.** Browse nearby Goodwill locations with their current top needs and surpluses. Tap a location to schedule a drop-off.
5. **Impact tab.** See your cumulative stats — items scanned, lbs diverted, CO2 saved, resale value generated.
6. **Profile tab.** Manage your account and view pending points.

## Project structure

```
src/
  app/
    _layout.tsx          # root layout
    camera.tsx           # scanner screen
    (tabs)/
      index.tsx          # home
      map.tsx            # demand heatmap
      impact.tsx         # dashboard
      profile.tsx 
      _layout.tsx       # layout for tabs
  components/            # shared UI
  services/
    gemini.ts            # Gemini API calls
    supabase.ts          # Supabase client
  hooks/
  constants/
```

## Scripts

- `npm start` — start Expo dev server
- `npm run ios` / `npm run android` / `npm run web` — start on a specific platform
- `npm run lint` — run Expo's linter
- `npm run reset-project` — reset to a fresh template (destructive)

## Troubleshooting

- **Camera permission denied** — open device settings and re-enable camera access for Expo Go, or use the in-app Allow Camera button.
- **Gemini misclassifies an item** — use the Override button on the result card.
- **Supabase slow on conference WiFi** — the demand data is cached at app startup; pull-to-refresh to retry.
- **Rate-limited by Gemini** — wait a second and retry; the app handles this automatically.
