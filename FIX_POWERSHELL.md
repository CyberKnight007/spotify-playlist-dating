# Fix PowerShell Execution Policy Error

## Quick Fix Options:

### Option 1: Use npx (Easiest - No Admin Needed)
Instead of `eas`, use `npx eas`:

```powershell
npx eas login
```

This bypasses the execution policy issue!

### Option 2: Use CMD Instead of PowerShell
1. Open **Command Prompt** (CMD) instead of PowerShell
2. Navigate to project:
   ```
   cd C:\Users\User\Documents\spotify-playlist-dating
   ```
3. Run:
   ```
   eas login
   ```

### Option 3: Change Execution Policy (Requires Admin)
If you want to fix PowerShell permanently:

1. Open PowerShell **as Administrator**
2. Run:
   ```powershell
   Set-ExecutionPolicy RemoteSigned
   ```
3. Type `Y` to confirm
4. Close and reopen PowerShell

## Recommended: Use Option 1 (npx)

Just use `npx eas` instead of `eas`:

```powershell
npx eas login
npx eas whoami
npx eas build --platform android --profile production
```

This works immediately without any admin rights!

