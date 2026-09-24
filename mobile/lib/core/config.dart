/// Backend base URL, baked in at build time:
///   flutter build apk --dart-define=API_BASE_URL=https://api.kasrevent.example.com/api
/// Defaults to an Android-emulator-friendly localhost alias for local development
/// (10.0.2.2 reaches the host machine's localhost from the Android emulator).
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api',
  );
}
