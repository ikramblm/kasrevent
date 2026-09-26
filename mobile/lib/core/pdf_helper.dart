import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Downloads a PDF from an authenticated API path (Dio already attaches the JWT) and hands
/// it to the OS share sheet, so the user can view it in any PDF viewer, save it, or send it —
/// there is no in-app PDF viewer, this reuses whatever the device already has.
Future<void> downloadAndSharePdf(Dio dio, String path, String filename) async {
  final response = await dio.get<List<int>>(path, options: Options(responseType: ResponseType.bytes));
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$filename');
  await file.writeAsBytes(response.data!);
  await Share.shareXFiles([XFile(file.path)], fileNameOverrides: [filename]);
}
