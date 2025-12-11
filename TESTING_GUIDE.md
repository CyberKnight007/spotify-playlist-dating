# 🧪 Complete Testing Guide for Spotify Playlist Dating App

This guide will help you test all features of your dating app, from authentication to messaging.

## 📋 Table of Contents

1. [Setup and Prerequisites](#setup-and-prerequisites)
2. [Testing Authentication](#testing-authentication)
3. [Testing Profile Setup](#testing-profile-setup)
4. [Testing Spotify Integration](#testing-spotify-integration)
5. [Testing Swipe Feature](#testing-swipe-feature)
6. [Testing Matches](#testing-matches)
7. [Testing Chat/Messaging](#testing-chatmessaging)
8. [Testing Playlists](#testing-playlists)
9. [Testing Profile Screen](#testing-profile-screen)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup and Prerequisites

### Start the Development Server

```bash
# Navigate to your project directory
cd "/Users/prashant178/Desktop/React Native/spotify-playlist-dating"

# Install dependencies (if not already done)
npm install

# Start Expo development server
npx expo start
```

### Choose Your Testing Platform

After starting the server, you'll see options:

- **Press `i`** - Run on iOS Simulator (Mac only)
- **Press `a`** - Run on Android Emulator
- **Scan QR Code** - Use Expo Go app on physical device

### Required Setup in Appwrite Console

Before testing, ensure you have configured:

1. **Database**: `6933e7230002691f918d`

   - ✅ Users collection
   - ✅ Swipes collection
   - ✅ Matches collection
   - ✅ Messages collection

2. **Storage**:

   - ✅ Avatars bucket

3. **Auth Providers**:
   - ✅ Email/Password enabled
   - ✅ Google OAuth configured
   - ✅ Spotify OAuth configured

---

## 🔐 Testing Authentication

### Test 1: Email Sign Up

**Steps:**

1. Launch the app
2. Tap **"Sign Up"** on the login screen
3. Enter test credentials:
   - Display Name: `Test User 1`
   - Email: `testuser1@example.com`
   - Password: `TestPassword123!`
4. Tap **"Create Account"**

**Expected Result:**

- ✅ Account created successfully
- ✅ Redirected to Profile Setup screen
- ✅ No errors in console

### Test 2: Email Sign In

**Steps:**

1. Go back to Login screen
2. Enter credentials:
   - Email: `testuser1@example.com`
   - Password: `TestPassword123!`
3. Tap **"Sign In"**

**Expected Result:**

- ✅ Successfully logged in
- ✅ Profile data loaded
- ✅ Redirected to appropriate screen based on profile completion

### Test 3: Google OAuth Login

**Steps:**

1. On Login screen, tap **"Google"** button
2. Browser opens with Google login
3. Sign in with your Google account
4. Authorize the app

**Expected Result:**

- ✅ OAuth flow completes
- ✅ User profile created automatically
- ✅ Redirected to Profile Setup

**Console Logs to Verify:**

```
Google OAuth - Redirect URI: [URL]
Google OAuth - Auth URL: [URL]
Google OAuth - Login successful!
```

### Test 4: Spotify OAuth Login

**Steps:**

1. On Login screen, tap **"Spotify"** button
2. Browser opens with Spotify login
3. Sign in and authorize

**Expected Result:**

- ✅ OAuth flow completes
- ✅ User profile created
- ✅ Spotify data synced automatically

---

## 👤 Testing Profile Setup

### Test 5: Complete Profile Setup

**Steps:**

1. After signing up, you'll be on Profile Setup screen
2. **Add Profile Photo:**
   - Tap the camera icon
   - Choose "Take Photo" or "Choose from Library"
   - Select/take a photo
   - Wait for upload progress (shows percentage)
3. **Fill in Bio:**
   - Enter: `Music lover 🎵 looking for concert buddies`
   - Character count should update
4. **Enter Age:**
   - Enter: `25`
5. **Enter Pronouns (optional):**
   - Enter: `He/Him`
6. **Enter City (optional):**
   - Enter: `San Francisco`
7. Tap **"Complete Profile"**

**Expected Result:**

- ✅ Photo uploads successfully (progress bar shows)
- ✅ Profile created in Appwrite database
- ✅ Success alert: "Profile Complete! 🎉"
- ✅ Redirected to Spotify onboarding or main app

**Console Logs to Verify:**

```
Updating profile for user: [USER_ID]
Profile updated successfully
or
Profile created successfully
```

### Test 6: Validation Checks

**Test without photo:**

- Tap "Complete Profile" without adding photo
- ✅ Should show: "Profile Picture Required"

**Test without bio:**

- Add photo but leave bio empty
- ✅ Should show: "Bio Required"

**Test invalid age:**

- Enter age `17` or `150`
- ✅ Should show: "Please enter your age (18-100)"

---

## 🎵 Testing Spotify Integration

### Test 7: Connect Spotify Account

**Steps:**

1. Navigate to **Profile** tab (bottom navigation)
2. Find "Spotify Connection" section
3. Tap **"Connect"** button
4. Sign in to Spotify
5. Authorize the app

**Expected Result:**

- ✅ Browser opens for Spotify auth
- ✅ Successfully connected
- ✅ Status changes to "Connected"
- ✅ Shows Spotify display name
- ✅ "Last synced" timestamp appears

### Test 8: Sync Spotify Data

**Steps:**

1. In Profile screen, find Spotify section
2. Tap **"Sync Now"**
3. Wait for sync to complete

**Expected Result:**

- ✅ Button shows "Syncing..."
- ✅ Top genres appear (e.g., "pop", "rock", "hip-hop")
- ✅ Top artists appear with profile pictures
- ✅ Playlists are fetched
- ✅ Last synced time updates

**Console Logs to Verify:**

```
[SpotifyContext] Syncing data...
[SpotifyContext] Fetched [X] playlists
[SpotifyContext] Sync completed
```

---

## 💚 Testing Swipe Feature

### Test 9: Create Test Users (for testing swipes)

**Prerequisite:** You need multiple users in the database to test swiping.

**Option A: Create via Appwrite Console**

1. Go to Appwrite Console > Databases > Users collection
2. Create 3-5 test users manually with:
   - displayName
   - bio
   - age
   - photoUrl (use placeholder: `https://i.pravatar.cc/300?img=1`)
   - profileComplete: `true`

**Option B: Create via App**

1. Log out from current account
2. Create new account with different email
3. Complete profile setup
4. Repeat 2-3 times

### Test 10: Swipe Right (Like)

**Steps:**

1. Go to **Swipe** tab (home screen)
2. Wait for user cards to load
3. Swipe a card to the **right** (or tap ❤️ button)

**Expected Result:**

- ✅ Card animates and disappears
- ✅ Swipe recorded in database
- ✅ Next card appears
- ✅ If mutual like: Match popup appears

**Console Logs to Verify:**

```
[SwipeScreen] Swiping right on user: [USER_ID]
[SwipeScreen] Swipe recorded
```

### Test 11: Swipe Left (Pass)

**Steps:**

1. On Swipe screen with a card
2. Swipe card to the **left** (or tap ✕ button)

**Expected Result:**

- ✅ Card animates and disappears
- ✅ Pass recorded
- ✅ Next card appears

### Test 12: Super Like

**Steps:**

1. On Swipe screen
2. Swipe **up** or tap ⭐ button

**Expected Result:**

- ✅ Special animation (sparkles/gold glow)
- ✅ Super like recorded
- ✅ User is notified of super like

### Test 13: View Profile Details

**Steps:**

1. On a swipe card, tap the **info icon** or user's photo
2. View expanded profile

**Expected Result:**

- ✅ Modal opens showing:
  - Full bio
  - Age and location
  - Top genres
  - Top artists
  - Shared music taste (if any)

---

## 💕 Testing Matches

### Test 14: Create a Match

**Steps:**

1. Have User A swipe right on User B
2. Log in as User B
3. Swipe right on User A

**Expected Result:**

- ✅ Match popup appears: "It's a Match! 🎉"
- ✅ Match appears in Matches tab
- ✅ Both users see the match
- ✅ Can start chatting

**Database Verification:**
Check Appwrite > Matches collection:

- ✅ Document created with both user IDs
- ✅ `matchedAt` timestamp set
- ✅ Status is "active"

### Test 15: View All Matches

**Steps:**

1. Navigate to **Matches** tab
2. View your matches list

**Expected Result:**

- ✅ All matches displayed with:
  - Profile photo
  - Name
  - Last message preview
  - Timestamp
- ✅ Online status indicator (green dot)
- ✅ Unread message count badge

---

## 💬 Testing Chat/Messaging

### Test 16: Send Text Message

**Steps:**

1. Go to **Matches** tab
2. Tap on a match to open chat
3. Type a message: `Hey! How's it going? 🎵`
4. Tap send button

**Expected Result:**

- ✅ Message appears immediately in chat
- ✅ Message saved to database
- ✅ Timestamp shows
- ✅ Sent indicator appears
- ✅ Other user receives message in real-time

**Console Logs to Verify:**

```
[MessageService] Sending message to match: [MATCH_ID]
[MessageService] Message sent successfully
```

### Test 17: Receive Messages

**Steps:**

1. Have another user (User B) send you a message
2. Keep your chat screen open

**Expected Result:**

- ✅ Message appears in real-time (no refresh needed)
- ✅ Notification badge updates
- ✅ Message sorted chronologically
- ✅ Typing indicator shows when other user types

### Test 18: Typing Indicator

**Steps:**

1. Open a chat
2. Start typing a message (don't send yet)
3. Check on the other user's device

**Expected Result:**

- ✅ Other user sees: "[Name] is typing..."
- ✅ Indicator disappears when you stop typing

**Console Logs:**

```
[RealtimeService] User [ID] is typing in match [MATCH_ID]
```

### Test 19: Mark Messages as Read

**Steps:**

1. Receive unread messages
2. Open the chat

**Expected Result:**

- ✅ Unread count badge clears
- ✅ Messages marked as read in database
- ✅ Sender sees "Read" indicator

### Test 20: Send Multiple Messages

**Steps:**

1. Send 5-10 messages rapidly
2. Scroll through chat history

**Expected Result:**

- ✅ All messages appear
- ✅ Correct order maintained
- ✅ No duplicate messages
- ✅ Smooth scrolling

---

## 🎼 Testing Playlists

### Test 21: View Playlists

**Steps:**

1. Ensure Spotify is connected
2. Navigate to **Playlists** tab

**Expected Result:**

- ✅ All Spotify playlists displayed
- ✅ Playlist covers load
- ✅ Track count shown
- ✅ Can scroll through list

### Test 22: View Playlist Details

**Steps:**

1. On Playlists tab
2. Tap on a playlist

**Expected Result:**

- ✅ Playlist details screen opens
- ✅ Shows all tracks
- ✅ Track info (name, artist, duration)
- ✅ Play preview option

---

## 👨‍💼 Testing Profile Screen

### Test 23: View Own Profile

**Steps:**

1. Navigate to **Profile** tab
2. Review your profile

**Expected Result:**

- ✅ Profile photo displays
- ✅ Stats show (Matches, Playlists, Views)
- ✅ Bio displays
- ✅ Location shows
- ✅ Spotify connection status

### Test 24: Edit Profile Photo

**Steps:**

1. On Profile screen
2. Tap camera icon on profile photo
3. Select new photo
4. Wait for upload

**Expected Result:**

- ✅ Photo picker opens
- ✅ Upload progress shows
- ✅ Photo updates on profile
- ✅ Changes reflected in database

### Test 25: Disconnect Spotify

**Steps:**

1. On Profile screen
2. In Spotify section, tap **"Disconnect"**
3. Confirm disconnection

**Expected Result:**

- ✅ Status changes to "Not Connected"
- ✅ Spotify data cleared
- ✅ Can reconnect later

---

## 🔄 Testing Real-time Features

### Test 26: Online/Offline Status

**Steps:**

1. Log in on one device
2. Check status on another user's match list
3. Close app
4. Check status again

**Expected Result:**

- ✅ Green dot when online
- ✅ "Last seen" timestamp when offline
- ✅ Updates in real-time

### Test 27: Live Message Delivery

**Steps:**

1. Open chat with User A on Device 1
2. Send message from User A on Device 2
3. Observe Device 1 without refreshing

**Expected Result:**

- ✅ Message appears instantly
- ✅ No page reload needed
- ✅ Smooth animation

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to sign in"

**Solution:**

```bash
# Check Appwrite connection
# Open src/services/appwrite.ts and verify:
- Project ID: 692c0bae0033b9e34774
- Endpoint: https://sgp.cloud.appwrite.io/v1
```

#### Issue: "Profile picture upload failed"

**Solution:**

1. Go to Appwrite Console > Storage
2. Ensure "avatars" bucket exists
3. Check permissions: Allow "create" and "read" for authenticated users

#### Issue: "No users to swipe"

**Solution:**

- Create test users in Appwrite Console
- Or sign up with multiple accounts

#### Issue: "Messages not sending"

**Solution:**

```bash
# Check console for errors
# Verify Messages collection exists
# Check database permissions
```

#### Issue: "Spotify not connecting"

**Solution:**

1. Verify Spotify OAuth in Appwrite Console
2. Check redirect URI: `appwrite-callback-692c0bae0033b9e34774://`
3. Ensure scopes are correct in AuthContext.tsx

---

## 📊 Testing Checklist

Use this checklist to track your testing progress:

### Authentication ✓

- [ ] Email sign up
- [ ] Email sign in
- [ ] Google OAuth
- [ ] Spotify OAuth
- [ ] Logout

### Profile ✓

- [ ] Profile setup with photo
- [ ] Profile validation
- [ ] Edit profile photo
- [ ] View profile details

### Spotify Integration ✓

- [ ] Connect Spotify
- [ ] Sync data
- [ ] View top genres
- [ ] View top artists
- [ ] View playlists
- [ ] Disconnect Spotify

### Swipe Feature ✓

- [ ] Swipe right (like)
- [ ] Swipe left (pass)
- [ ] Super like
- [ ] View profile details
- [ ] Match creation

### Matches ✓

- [ ] View all matches
- [ ] Match popup
- [ ] Online status
- [ ] Last seen

### Messaging ✓

- [ ] Send text message
- [ ] Receive messages
- [ ] Typing indicator
- [ ] Read receipts
- [ ] Message history
- [ ] Real-time updates

### UI/UX ✓

- [ ] Smooth animations
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Navigation flow

---

## 🎯 Quick Testing Script

For rapid testing, run through this flow:

```
1. npm start
2. Sign up → testuser1@example.com
3. Complete profile → Add photo, bio, age
4. Connect Spotify → Authorize and sync
5. Go to Swipe → Swipe right on 2-3 users
6. Create match → Use second account to swipe back
7. Send message → "Test message 123"
8. Check real-time → Message appears instantly
9. View profile → All data displays correctly
10. Logout → Clean exit
```

---

## 📱 Testing on Physical Device

### iOS (TestFlight/Direct Install)

```bash
# Build for iOS
eas build --platform ios --profile preview
# Download and install on device
```

### Android (APK)

```bash
# Build APK
eas build --platform android --profile preview
# Download APK and install on device
```

---

## 🚀 Performance Testing

### Load Testing

1. Create 50+ test users
2. Load swipe screen
3. Measure load time
4. Target: < 2 seconds

### Real-time Testing

1. Send 20 messages rapidly
2. Check delivery speed
3. Target: < 500ms per message

---

## ✅ Test Report Template

After testing, document results:

```markdown
## Test Session: [Date]

**Tester:** [Your Name]
**Device:** [iOS/Android]
**Version:** 1.0.0

### Results

- Authentication: ✅ PASS / ❌ FAIL
- Profile Setup: ✅ PASS / ❌ FAIL
- Spotify Sync: ✅ PASS / ❌ FAIL
- Swipe Feature: ✅ PASS / ❌ FAIL
- Matches: ✅ PASS / ❌ FAIL
- Messaging: ✅ PASS / ❌ FAIL

### Issues Found

1. [Issue description]
2. [Issue description]

### Notes

[Additional observations]
```

---

Good luck with testing! 🎉 If you encounter any issues, check the console logs and refer to the troubleshooting section.
