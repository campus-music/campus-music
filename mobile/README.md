# Campus Music Mobile App

React Native + Expo mobile app for Campus Music that connects to the existing Node/Express/PostgreSQL backend.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (iOS/Android)

## Getting Started

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Update `API_URL` to point to your backend

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with:
   - **iOS**: Camera app or Expo Go
   - **Android**: Expo Go app

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth stack (login, signup, forgot-password)
│   ├── (tabs)/            # Main tab navigator (home, explore, live, profile)
│   ├── artist/[id].tsx    # Artist profile screen
│   ├── live/[id].tsx      # Live stream viewer
│   ├── live/go-live.tsx   # Go live screen (artists only)
│   ├── player.tsx         # Full-screen audio player
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable components
│   └── MiniPlayer.tsx     # Mini player for tab bar
├── lib/                   # Core utilities
│   ├── api.ts            # API client with session handling
│   ├── auth.tsx          # Auth context provider
│   └── audio.tsx         # Audio player context
├── constants/            # App constants
│   └── Colors.ts         # Color palette
└── assets/               # Images, fonts, etc.
```

## Features

### Authentication
- Login/Signup with session-based auth
- Secure session storage using Expo SecureStore
- Role-based access (listener vs artist)

### Main Screens
- **Home**: Trending tracks + Artist Feed
- **Explore**: Search artists/tracks, browse by genre
- **Live**: Watch/host live streams
- **Profile**: User profile and settings

### Audio Player
- Background audio playback
- Mini player in tab bar
- Full-screen player modal

### Live Streaming (Beta)
- Watch live streams
- Real-time chat
- Go Live for artists

## Tech Stack

- **Framework**: React Native + Expo SDK 51
- **Routing**: Expo Router v3
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Query + Context API
- **Audio**: expo-av
- **Secure Storage**: expo-secure-store
- **Icons**: @expo/vector-icons (Ionicons)

## API Connection

The app connects to the Campus Music backend API. Configure the API URL in your `.env`:

```
API_URL=https://your-api-url.com/api
```

For local development, use your machine's IP address or tunnel URL.

## Building for Production

### iOS
```bash
npx expo build:ios
# or with EAS
eas build --platform ios
```

### Android
```bash
npx expo build:android
# or with EAS
eas build --platform android
```

## Next Steps

- [ ] Implement push notifications
- [ ] Add offline support
- [ ] Implement track queue/playlist
- [ ] Add social sharing
- [ ] Implement in-app purchases
- [ ] Add analytics
- [ ] Implement deep linking

## Troubleshooting

### Common Issues

1. **Metro bundler errors**: Clear cache with `npx expo start -c`
2. **Module not found**: Delete `node_modules` and reinstall
3. **iOS simulator issues**: Run `npx expo run:ios`
4. **Android emulator issues**: Run `npx expo run:android`
