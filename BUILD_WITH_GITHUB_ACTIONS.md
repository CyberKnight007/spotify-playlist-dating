# Build Android APK with GitHub Actions (FREE!)

This guide shows you how to build your Android APK using GitHub Actions - completely free, no EAS/Expo account limits!

## ✅ Benefits

- **100% FREE** - No build limits
- **No account needed** - Just GitHub (free)
- **Automatic builds** - On every push
- **Manual trigger** - Build anytime from GitHub UI
- **APK download** - Get your APK as an artifact

## 🚀 Quick Start

### Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```powershell
git add .
git commit -m "Add GitHub Actions build workflow"
git push origin master
```

### Step 2: Trigger Build

**Option A: Automatic (on push)**
- Just push to `master` or `main` branch
- Build starts automatically

**Option B: Manual trigger**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build Android APK** workflow
4. Click **Run workflow** button
5. Click **Run workflow** again

### Step 3: Download APK

1. Wait for build to complete (~10-15 minutes)
2. Click on the completed workflow run
3. Scroll down to **Artifacts** section
4. Click **app-release** to download
5. Extract the ZIP file to get your APK!

## 📍 APK Location

After downloading:
- Extract the ZIP file
- You'll find: `app-release.apk`
- Install on any Android device!

## 🔧 How It Works

The workflow:
1. ✅ Sets up Node.js and Java
2. ✅ Installs dependencies
3. ✅ Generates Android project (`expo prebuild`)
4. ✅ Builds APK with Gradle
5. ✅ Uploads APK as artifact

## 🎯 Requirements

- **GitHub account** (free)
- **Repository on GitHub** (public or private)
- That's it! No EAS, no Expo account limits!

## 💡 Tips

- **Public repos**: Unlimited free builds
- **Private repos**: 2000 minutes/month free (plenty for builds)
- **Build time**: ~10-15 minutes per build
- **APK retention**: 30 days (download before then)

## 🆚 vs EAS Build

| Feature | GitHub Actions | EAS Build |
|---------|---------------|-----------|
| Cost | FREE | Free tier limited |
| Build limits | Unlimited (public) | Monthly limit |
| Setup | One-time | Account needed |
| Speed | ~10-15 min | ~10-15 min |
| APK download | GitHub artifacts | Expo dashboard |

## 🐛 Troubleshooting

### Build fails?
- Check the **Actions** tab for error logs
- Make sure all dependencies are in `package.json`
- Verify `app.json` is valid

### Can't find APK?
- Check **Artifacts** section at bottom of workflow run
- Make sure build completed successfully (green checkmark)

### Want faster builds?
- Use manual trigger only when needed
- Don't trigger on every commit (modify workflow)

## 📝 Next Steps

1. **Push code to GitHub**
2. **Trigger build** (automatic or manual)
3. **Download APK** from artifacts
4. **Install on device** and test!

That's it! No more EAS build limits! 🎉

