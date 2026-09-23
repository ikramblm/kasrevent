# Mobile apps (Android & iOS)

KasrEvent's React frontend is wrapped as native Android and iOS apps using
[Capacitor](https://capacitorjs.com) — it packages the same web UI (`frontend/dist`) inside
a thin native shell, rather than a separate rewrite. This is the pragmatic path from "one
React codebase" to "installable on both app stores"; if a fully native look/feel or
device-API-heavy features are needed later, individual screens can be replaced without
starting over.

```
frontend/
  capacitor.config.ts   # app id, name, web dir
  android/              # generated native Android project (committed to git)
  ios/                  # generated native iOS project (committed to git)
```

## How a build works

1. `npm run build --workspace frontend` — builds the web app into `frontend/dist`, using
   `VITE_API_BASE_URL` (see `frontend/.env.production.example`) as the backend URL, since a
   packaged app has no dev-server proxy to rely on.
2. `npx cap sync android` / `npx cap sync ios` (run from `frontend/`) — copies the fresh
   `dist` into the native projects and updates native dependencies.
3. The native project is built with the platform's own toolchain (Gradle for Android,
   Xcode for iOS).

## Android — fully automated (`.github/workflows/android-build.yml`)

On every push to `main` (or manually via **Actions → Build Android APK → Run workflow**),
GitHub builds a debug APK and uploads it as a workflow artifact — **no Mac, no paid account,
no local Android Studio needed.** To get the file:

1. Push to GitHub (see the repo root for the exact commands).
2. Go to the repo's **Actions** tab → the latest **Build Android APK** run → download the
   `kasrevent-debug-apk` artifact (a zip containing `app-debug.apk`).
3. Install it on a device with "install unknown apps" enabled, or an emulator.

The workflow installs an explicit Android SDK package list (`platforms;android-36`,
`build-tools;36.0.0`) matching `compileSdkVersion`/`targetSdkVersion` in
`frontend/android/variables.gradle` — if you ever bump those (e.g. Capacitor upgrades the
generated project to a newer API level), update the `packages:` list in
`.github/workflows/android-build.yml` to match, or the SDK setup step will fail.

This produces a **debug** APK, fine for internal testing/sideloading. For a Play Store
release you additionally need:
- A release signing keystore (`keytool -genkey ...`), added to the repo as GitHub secrets
  (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD`), and a `signingConfigs` block in
  `frontend/android/app/build.gradle` referencing them.
- Then build `./gradlew bundleRelease` (AAB, what the Play Store wants) instead of
  `assembleDebug`.

To build locally instead of via CI: `npm run android:open` opens the project in Android
Studio (requires it installed), or `npm run android:build-debug` runs the Gradle build
directly if you have the Android SDK installed locally.

## iOS — CI only compiles it; you must sign it yourself

Apple requires a **paid Apple Developer Program membership** (currently ~$99/year) and
signing certificates/provisioning profiles to produce an IPA installable on a real device,
via TestFlight, or on the App Store — there is no free workaround, and this project cannot
create Apple credentials on your behalf.

What **is** automated (`.github/workflows/ios-build.yml`, runs on a GitHub-hosted macOS
runner): an unsigned build for the iOS Simulator on every push to `main`, as a build-health
check (catches "it doesn't compile for iOS" early). This has not been run end-to-end in this
environment (no macOS available while building this project) — treat the first real run on
your repo as a smoke test, and fix any Xcode-version-specific issues it surfaces.

**To get a real, installable iOS app once you have an Apple Developer account:**

1. Open the project in Xcode: `npm run ios:open` (requires a Mac with Xcode installed).
2. In Xcode: select the `App` target → **Signing & Capabilities** → sign in with your Apple
   ID and pick your Team; Xcode will manage certificates/provisioning automatically for
   development builds.
3. **Product → Archive**, then use the Organizer window to upload to App Store Connect
   (for TestFlight/App Store) or export an ad-hoc IPA (for direct device installs).
4. To automate this in CI instead of doing it locally every time, add
   [fastlane](https://fastlane.tools) (`match` for certificate management,
   `gym`/`pilot`/`deliver` for building and uploading) — this is a meaningful follow-up
   project, not something to bolt on blindly without your Apple credentials in hand.

## App identity, icon, splash screen

- App ID (`com.kasrevent.app`) and display name (`KasrEvent`) are set in
  `frontend/capacitor.config.ts` — changing either after a store submission requires
  republishing as a new app, so lock these in before your first real release.
- Default Capacitor icons/splash screens are currently in place (placeholders). Replace them
  with `@capacitor/assets` (`npx capacitor-assets generate`) once you have real artwork —
  see https://capacitorjs.com/docs/guides/splash-screens-and-icons.

## Native permissions

The in-app QR scanner (`html5-qrcode`, used on the web and inside the native WebView) needs
camera access. This is already wired up:
`frontend/android/app/src/main/AndroidManifest.xml` declares
`android.permission.CAMERA`, and `frontend/ios/App/App/Info.plist` has an
`NSCameraUsageDescription` string. Neither was generated by Capacitor by default — both were
added by hand, so if you ever regenerate either native project from scratch
(`cap add android`/`cap add ios` again), re-add them.
