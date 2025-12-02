# Campus Music Mobile App

React Native + Expo mobile app for Campus Music - a music streaming platform for university students.

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Routing**: Expo Router v4
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated
- **State**: React Query + Context API
- **Audio**: expo-av (background audio support)
- **Secure Storage**: expo-secure-store

## Prerequisites

- Node.js 18+
- npm or yarn
- For Android Studio: Android Studio with SDK 34+
- For EAS Build: Expo account (free at expo.dev)

---

## Build Options

### Option 1: EAS Build (Recommended - No Local Setup Required)

EAS Build compiles your app in the cloud. No Android Studio or Xcode needed!

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Navigate to mobile folder
cd mobile

# 4. Install dependencies
npm install

# 5. Build APK for Android
eas build --platform android --profile preview

# 6. Download the APK from the link provided
```

The build takes about 10-15 minutes. You'll get a download link for the APK.

---

### Option 2: Android Studio (Local Build)

Build locally with full control over the native code.

#### Setup

1. **Install Android Studio** from https://developer.android.com/studio

2. **Configure SDK**: Open Android Studio > SDK Manager
   - Install Android SDK 34
   - Install Android SDK Build-Tools
   - Install Android Emulator (optional)

3. **Set environment variables**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### Build Steps

```bash
# 1. Navigate to mobile folder
cd mobile

# 2. Install dependencies
npm install

# 3. Generate native Android project
npx expo prebuild --platform android

# 4. Open in Android Studio
# File > Open > select mobile/android folder

# 5. Build APK
# Build > Build Bundle(s) / APK(s) > Build APK(s)

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

Or build from command line:
```bash
cd android
./gradlew assembleDebug

# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Option 3: iOS Build (Mac Required)

```bash
# EAS Build (cloud - no Mac needed for build, but needs Apple Developer account)
eas build --platform ios --profile preview

# Local build (Mac only)
npx expo prebuild --platform ios
cd ios && pod install
open CampusMusic.xcworkspace
# Build from Xcode
```

---

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
│   └── Colors.ts         # Color palette matching web app
├── assets/               # App icons and splash screens
├── global.css            # Tailwind CSS imports
├── tailwind.config.js    # NativeWind theme configuration
├── metro.config.js       # Metro bundler with NativeWind
├── babel.config.js       # Babel with Reanimated plugin
└── eas.json              # EAS Build profiles
```

## Features

### Authentication
- Login/Signup with session-based auth
- Secure session storage using Expo SecureStore
- Role-based access (listener vs artist)
- .edu email validation for artists

### Main Screens
- **Home**: Trending tracks + personalized feed
- **Explore**: Search artists/tracks, browse by genre
- **Live**: Watch/host live streams
- **Profile**: User profile, settings, music taste

### Audio Player
- Background audio playback (works when app is minimized)
- Mini player in tab bar
- Full-screen player modal with album art
- Track progress and seek

### Live Streaming
- Watch live streams from artists
- Real-time chat
- Go Live for verified artists

### Styling
- Dark theme matching web app (Apple Music/Spotify inspired)
- Coral brand color (#E84A5F)
- Smooth animations with Reanimated

---

## Configuration

### API Connection

Update `.env` with your backend URL:
```
API_URL=https://your-replit-app.replit.app/api
```

### App Icons

Replace placeholder icons in `assets/`:
- `icon.png` - 1024x1024 app icon
- `adaptive-icon.png` - 1024x1024 Android adaptive icon
- `splash.png` - 1284x2778 splash screen
- `favicon.png` - 48x48 web favicon

---

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start -c
   ```

2. **Metro bundler cache**
   ```bash
   npx expo start -c  # Clear cache
   ```

3. **Android build fails**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo prebuild --clean
   ```

4. **NativeWind styles not applying**
   - Ensure `global.css` is imported in `_layout.tsx`
   - Run `npx expo start -c` to clear cache

---

## Development

### Running Locally

```bash
cd mobile
npm install
npx expo start
```

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start Android development
- `npm run ios` - Start iOS development
- `npm run prebuild` - Generate native projects
- `npm run build:android` - Build Android APK via EAS
- `npm run build:ios` - Build iOS via EAS

---

## Credits

Built with Expo, React Native, and NativeWind.
Part of the Campus Music platform for university student artists.
