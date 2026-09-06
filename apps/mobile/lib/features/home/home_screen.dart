import 'package:flutter/material.dart';

import 'brand_header.dart';
import 'guarantees_card.dart';
import 'hero_section.dart';
import 'room_card.dart';
import 'session_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

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
                  const BrandHeader(),
                  const HeroSection(),
                  RoomCard(
                    errorText: _error,
                    onShowError: _showError,
                    onDismissError: _dismissError,
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
