# What to Expect During Build

## What You'll See:

### Initial Phase (1-2 minutes):
```
✔ Validated credentials
✔ Created new build
📦 Uploading project files...
```

### Upload Phase (2-3 minutes):
```
📦 Uploading project files...
✔ Uploaded project files
```

### Build Phase (10-15 minutes):
```
🔨 Building Android app...
⏳ This may take a while...
```

### Completion:
```
✔ Build finished!
📱 Download: https://expo.dev/...
```

## If It Looks Stuck:

### Check Build Status:
Open a **new terminal** and run:
```powershell
npx eas build:list --limit=1
```

This shows the current build status.

### Or Check Online:
1. Go to: https://expo.dev/accounts/[your-username]/builds
2. See real-time progress there
3. Shows: "Queued" → "In Progress" → "Finished"

## Build Stages:

1. **Queued** - Waiting to start (1-2 min)
2. **In Progress** - Building (10-15 min)
3. **Finished** - Ready to download

## Tips:

- ✅ Terminal shows progress updates
- ✅ You can check status online
- ✅ Build takes 10-15 minutes total
- ✅ You'll get a download link when done

## If Nothing Shows:

The build might be running but terminal isn't updating. Check:
- Online dashboard: https://expo.dev/accounts/[username]/builds
- Or run: `npx eas build:list`

