# Asset Placeholders Required

Before building, you need to add the following image assets:

## Required Files

1. **icon.png** (1024x1024)
   - Main app icon
   - Solid background with Campus Music logo

2. **adaptive-icon.png** (1024x1024)
   - Android adaptive icon foreground
   - Should have transparent background
   - Icon centered with padding

3. **splash.png** (1284x2778)
   - Splash screen shown on app launch
   - Campus Music logo centered
   - Background color: #0a0a0a (dark)

4. **favicon.png** (48x48)
   - Web favicon
   - Simple logo version

## Quick Solution

For quick testing, you can use any 1024x1024 PNG as both icon.png and adaptive-icon.png.
Use a 1284x2778 dark image as splash.png.

## Generate with Expo

After adding icon.png, run:
```bash
npx expo-optimize
```

This will generate optimized versions for all platforms.

## Brand Colors

- Primary: #E84A5F (coral)
- Background: #0a0a0a (dark)
- Surface: #141414
