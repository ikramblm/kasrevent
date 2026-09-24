import 'package:flutter/material.dart';

/// Standard loading / error / data states for a FutureBuilder-backed screen, so every
/// list screen doesn't reimplement the same three branches.
class AsyncView<T> extends StatelessWidget {
  const AsyncView({super.key, required this.future, required this.builder, this.onRetry});

  final Future<T> future;
  final Widget Function(BuildContext context, T data) builder;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 36),
                  const SizedBox(height: 12),
                  Text('${snapshot.error}', textAlign: TextAlign.center),
                  if (onRetry != null) ...[
                    const SizedBox(height: 12),
                    OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
                  ],
                ],
              ),
            ),
          );
        }
        return builder(context, snapshot.data as T);
      },
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message, this.icon = Icons.inbox_outlined});
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(message, style: TextStyle(color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }
}
