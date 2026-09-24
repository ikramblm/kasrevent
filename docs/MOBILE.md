# Mobile app (Flutter)

`mobile/` is a real native Android/iOS app written in Flutter/Dart — not a website wrapped
in a native shell. It's a separate client from the React web dashboard (`frontend/`), talking
to the **same** backend REST API (`backend/`, see [docs/API.md](API.md)), since the API is
plain JSON over HTTP and doesn't care what's calling it.

```
mobile/
  lib/
    core/            API client (Dio), secure token storage, theme, build-time config
    models/          Dart data classes matching the API's JSON shapes
    providers/       AuthProvider (session/JWT lifecycle)
    screens/         One file per app screen
    widgets/         Shared UI: AppScaffold, AppDrawer, StatusBadge, SimpleCrudScreen, …
    routes.dart       Named-route table
    main.dart
  android/, ios/     Generated native projects (committed to git)
  test/              Unit + widget tests
```

## Why Flutter here, not the previous Capacitor build

An earlier iteration of this project wrapped the React web dashboard in Capacitor to get
Android/iOS builds quickly. That was replaced with this real Flutter app because a
WebView-wrapped website is not what "an app" means here — Flutter compiles to actual native
UI widgets, not an embedded browser. The web dashboard (`frontend/`) still exists as a
separate, legitimate product (a browser-based back-office), but it is no longer wrapped as a
mobile app; `mobile/` is the app now.

## Feature coverage vs. the web dashboard

Implemented: login (JWT), role-filtered navigation (Admin/Gérant/User, same tiers as the web
app), dashboard KPIs, Réservations (list/create/detail/close/archive), Clients, Salles
(with a map-link button), guest management + QR code generation, **camera-based QR check-in
scanning** (`mobile_scanner`), Confiscations téléphones (with restitution), Charges (with the
same type-conditional fields as the web form), Fournisseurs, Traiteurs, Décorations, Employés
(with the monthly-payroll-run action), Historique de paie, Utilisateurs (Admin).

Not ported to the mobile app (present on the web dashboard only): the public booking-request
/ RSVP intake pages (`Demandes de réservation`, RSVP — these are meant for the *public*, who
won't have this app installed, so they stay as web pages), the site-config screen
(`Admin config`), and data-visualization charts on the dashboard (the mobile dashboard shows
the same KPI numbers as plain cards, no charts).

## Configuring the backend URL

The app needs to know where your backend lives, baked in at build time:

```bash
flutter build apk --dart-define=API_BASE_URL=https://api.kasrevent.example.com/api
```

Without it, the app defaults to `http://10.0.2.2:4000/api` (the Android emulator's alias for
your host machine's `localhost:4000`) — convenient for local development, useless on a real
phone or in a CI-built APK. The CI workflows below read this from a repository variable.

## Android — fully automated (`.github/workflows/flutter-android.yml`)

On every push to `main` (or manually via **Actions → Build Flutter Android APK → Run
workflow**), GitHub analyzes, tests, and builds a debug APK, uploading it as a workflow
artifact:

1. Push to GitHub.
2. **Settings → Secrets and variables → Actions → Variables** → add `API_BASE_URL` pointing
   at your deployed backend (e.g. `https://api.kasrevent.example.com/api`) — do this **before**
   the first real build, or the APK will be built pointing at nothing.
3. Go to the repo's **Actions** tab → the latest **Build Flutter Android APK** run → download
   the `kasrevent-debug-apk` artifact → unzip → `app-debug.apk`.
4. Install it on a device with "install unknown apps" enabled, or an emulator.

This is a **debug** build — fine for internal testing/sideloading. For a Play Store release:
- Generate a release keystore (`keytool -genkey ...`), add it to the repo as GitHub secrets,
  and configure `signingConfigs` in `mobile/android/app/build.gradle.kts`.
- Build `flutter build appbundle --release` (the `.aab` format the Play Store wants) instead
  of the debug APK.

To build locally instead of via CI: `cd mobile && flutter run` (needs a connected
device/emulator and the Android SDK's cmdline-tools installed — see `flutter doctor`), or
`flutter build apk --debug`.

## iOS — CI only compiles it; you must sign it yourself

Apple requires a **paid Apple Developer Program membership** (~$99/year) and signing
certificates/provisioning profiles to produce an IPA installable on a real device, via
TestFlight, or the App Store — there is no free workaround, and nothing here has your Apple
credentials.

What **is** automated (`.github/workflows/flutter-ios.yml`, on a GitHub-hosted macOS
runner): an unsigned build for the iOS Simulator on every push to `main`, as a build-health
check. This has not been run end-to-end in this environment (no macOS available while
building this project) — treat its first real run on your repo as a smoke test.

**To get a real, installable iOS app once you have an Apple Developer account:**

1. `cd mobile && open ios/Runner.xcworkspace` (needs a Mac with Xcode).
2. In Xcode: select the `Runner` target → **Signing & Capabilities** → sign in with your
   Apple ID and pick your Team; Xcode manages development certificates/provisioning
   automatically.
3. **Product → Archive**, then use the Organizer to upload to App Store Connect
   (TestFlight/App Store) or export an ad-hoc IPA for direct device installs.
4. To automate this in CI instead of doing it locally every time, add
   [fastlane](https://fastlane.tools) (`match` for certificates, `gym`/`pilot`/`deliver` for
   building and uploading) — a meaningful follow-up project once you have Apple credentials
   in hand, not something to bolt on blindly without them.

## App identity, icon, splash screen

- Application id: `com.kasrevent.kasrevent_mobile` (Android `applicationId` /
  `namespace` in `mobile/android/app/build.gradle.kts`; iOS `PRODUCT_BUNDLE_IDENTIFIER` in
  Xcode project settings). Changing this after a store submission means republishing as a
  new app — lock it in (rename it if you want something cleaner) before your first real
  release.
- Display name: "KasrEvent" (Android `AndroidManifest.xml`'s `android:label`; iOS
  `Info.plist`'s `CFBundleDisplayName`).
- Default Flutter launcher icon/splash screen are currently placeholders. Replace them with
  the `flutter_launcher_icons` and `flutter_native_splash` packages once you have real
  artwork.

## Native permissions

The in-app QR scanner (`mobile_scanner`) needs camera access — already wired up by hand (not
generated automatically): `android/app/src/main/AndroidManifest.xml` declares
`android.permission.CAMERA`, and `ios/Runner/Info.plist` has an `NSCameraUsageDescription`
string. Both also declare `android.permission.INTERNET` (Android; iOS needs no equivalent
entry) since a release build won't have network access without it — Flutter's debug/profile
builds get it for free via their own manifest overlay, which masked this during local
testing.
