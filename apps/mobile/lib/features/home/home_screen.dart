import 'package:flutter/material.dart';

import '../../services/settings_service.dart';
import '../chat/chat_screen.dart';
import 'brand_header.dart';
import 'guarantees_card.dart';
import 'hero_section.dart';
import 'room_card.dart';
import 'session_bar.dart';
import 'settings_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.settings, required this.onSettingsChanged});

  final AppSettings settings;
  final ValueChanged<AppSettings> onSettingsChanged;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _error;

  void _showError(String message) => setState(() => _error = message);

  void _dismissError() => setState(() => _error = null);

  void _toggleSimulatedDrop() {
    setState(() {
      _error = _error == null
          ? 'Mesh signal degraded: Peer discovery relay timeout.'
          : null;
    });
  }

  Future<void> _openSettings() async {
    final updated = await showDialog<AppSettings>(
      context: context,
      builder: (_) => SettingsDialog(settings: widget.settings),
    );
    if (updated != null) {
      widget.onSettingsChanged(updated);
      SettingsService.save(updated);
    }
  }

  void _enterChat(String roomId) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ChatScreen(
        displayName: widget.settings.displayName,
        backendUrl: widget.settings.backendUrl,
        roomId: roomId,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BrandHeader(onSettings: _openSettings),
                  const HeroSection(),
                  RoomCard(
                    errorText: _error,
                    onShowError: _showError,
                    onDismissError: _dismissError,
                    backendUrl: widget.settings.backendUrl,
                    onCreateRoom: _enterChat,
                    onJoinRoom: _enterChat,
                  ),
                  const SizedBox(height: 24),
                  const GuaranteesCard(),
                  const SizedBox(height: 24),
                  SessionBar(onToggleSimulatedDrop: _toggleSimulatedDrop),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}