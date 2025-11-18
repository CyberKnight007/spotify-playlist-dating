# Building APK for Android

This guide will help you build an APK file that can be installed directly on Android devices.

## Prerequisites

1. **Expo Account** (free): Sign up at https://expo.dev
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```

## Quick Start (EAS Build - Recommended)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure Project (First Time Only)
```bash
eas build:configure
```
This will set up the project for EAS builds.

### Step 4: Build APK
```bash
# Build preview APK (for testing)
npm run build:apk

# Or build production APK
npm run build:android:prod
```

### Step 5: Download APK
- The build will run on Expo's servers (takes ~10-15 minutes)
- You'll get a link to download the APK when it's ready
- Or check your build status: `eas build:list`

## Alternative: Local Build (Advanced)

If you want to build locally without Expo's servers:

### Prerequisites
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK)

### Build Locally
```bash
# Install dependencies
npm install

# Build APK locally
eas build --platform android --local --profile preview
```

The APK will be generated in your project directory.

## Build Profiles

The project has three build profiles in `eas.json`:

1. **development** - For development with Expo Go
2. **preview** - For testing (APK format)
3. **production** - For release (APK format)

## APK Location

After building, your APK will be:
- **EAS Build (Cloud)**: Download link provided in terminal/Expo dashboard
- **Local Build**: In your project root or `android/app/build/outputs/apk/`

## Installing the APK

1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file and install

## Troubleshooting

### "EAS CLI not found"
```bash
npm install -g eas-cli
```

### "Not logged in"
```bash
eas login
```

### "Build failed"
- Check your `app.json` configuration
- Ensure all dependencies are in `package.json`
- Review build logs: `eas build:list`

### "Package name already exists"
- Change the `package` name in `app.json`:
  ```json
  "android": {
    "package": "com.yourname.playlistmatch"
  }
  ```

## Build Status

Check your builds:
```bash
eas build:list
```

View build details:
```bash
eas build:view [BUILD_ID]
```

## Notes

- **First build**: Takes longer (~15-20 minutes) as it sets up the build environment
- **Subsequent builds**: Faster (~10-15 minutes) due to caching
- **Free tier**: Expo provides free builds, but with some limitations
- **APK size**: Expect ~30-50 MB for the initial APK

## Signing (For Production)

For production releases, you'll need to set up app signing:

```bash
eas credentials
```

Follow the prompts to configure Android signing credentials.

---

**Need help?** Check the [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/)

