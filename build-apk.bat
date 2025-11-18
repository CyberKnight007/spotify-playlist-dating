@echo off
echo ========================================
echo Building Playlist Match APK
echo ========================================
echo.

echo Step 1: Checking EAS CLI...
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo EAS CLI not found. Installing...
    npm install -g eas-cli
    if %errorlevel% neq 0 (
        echo Failed to install EAS CLI. Please install manually.
        pause
        exit /b 1
    )
) else (
    echo EAS CLI found!
)
echo.

echo Step 2: Checking Expo login...
eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Not logged in. Please login...
    eas login
    if %errorlevel% neq 0 (
        echo Login failed. Please try again.
        pause
        exit /b 1
    )
) else (
    echo Already logged in!
)
echo.

echo Step 3: Starting APK build...
echo This will take 10-15 minutes. Please wait...
echo.

npm run build:android:prod

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Build completed successfully!
    echo Check the download link above.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Build failed. Check errors above.
    echo ========================================
)

pause

