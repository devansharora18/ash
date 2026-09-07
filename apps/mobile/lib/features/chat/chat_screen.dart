import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

import '../../services/rtc_mesh.dart';
import '../../services/signaling.dart';
import '../../theme.dart';
import 'channel_bar.dart';
import 'chat_header.dart';
import 'composer.dart';
import 'leave_dialog.dart';
import 'message_bubble.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.displayName,
    required this.backendUrl,
    required this.roomId,
    this.connectClient,
    this.iceServers = const [],
  });

  final String displayName;
  final String backendUrl;
  final String roomId;

  /// Overridable for testing. Defaults to [Signaling.connect].
  final SignalClient Function({
    required String backendUrl,
    required String roomId,
    required String peerId,
  })? connectClient;

  /// ICE servers for WebRTC (STUN + optional TURN). Empty keeps STUN default.
  final List<Map<String, dynamic>> iceServers;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatMessage {
  const _ChatMessage({
    required this.self,
    required this.author,
    required this.time,
    required this.text,
  });

  final bool self;
  final String author;
  final String time;
  final String text;
}

enum _ChatStatus { connecting, connected, error }

class _TransferItem {
  _TransferItem({
    required this.peerId,
    required this.id,
    required this.name,
    required this.size,
    required this.sent,
    required this.isSend,
  });

  final String peerId;
  final String id;
  final String name;
  final int size;
  int sent;
  final bool isSend;

  String get key => '$peerId/$id';
}

class _ChatScreenState extends State<ChatScreen> {
  final _scrollController = ScrollController();
  final List<_ChatMessage> _messages = [];
  final List<String> _peers = [];
  final Map<String, bool> _connections = {};

  SignalClient? _signaling;
  StreamSubscription<SignalEvent>? _sub;
  RtcMesh? _mesh;
  _ChatStatus _status = _ChatStatus.connecting;
  String? _errorMessage;

  Map<String, dynamic>? _incomingFile;
  final Map<String, _TransferItem> _transfers = {};

  int get _connectedCount => _connections.values.where((v) => v).length;

  @override
  void initState() {
    super.initState();
    _connect();
  }

  void _connect() {
    final connect = widget.connectClient ?? Signaling.connect;
    _signaling = connect(
      backendUrl: widget.backendUrl,
      roomId: widget.roomId,
      peerId: widget.displayName,
    );
    _mesh = RtcMesh(
      widget.displayName,
      (to, data) {
        _signaling?.send(to, data);
      },
      RtcMeshCallbacks()
        ..onMessage = (from, text) {
          _addMessage(self: false, author: from, text: text);
        }
        ..onConnectionChange = (peerId, connected) {
          setState(() => _connections[peerId] = connected);
        }
        ..onFileOffer = (from, id, name, size) {
          setState(() => _incomingFile = {
            'from': from,
            'id': id,
            'name': name,
            'size': size,
          });
        }
        ..onFileProgress = (peerId, id, name, size, sent, isSend) {
          setState(() {
            final key = '$peerId/$id';
            final item = _transfers[key];
            if (item == null) {
              _transfers[key] = _TransferItem(
                peerId: peerId,
                id: id,
                name: name,
                size: size,
                sent: sent,
                isSend: isSend,
              );
            } else {
              item.sent = sent;
            }
          });
        }
        ..onFileComplete = (from, id, name, bytes) {
          _transfers.remove('$from/$id');
          unawaited(_saveIncoming(name, bytes));
        }
        ..onFileCancelled = (peerId) {
          setState(() {
            _transfers.removeWhere((_, t) => t.peerId == peerId);
            if (_incomingFile?['from'] == peerId) _incomingFile = null;
          });
        },
      widget.iceServers,
    );
    _sub = _signaling!.events.listen(_onEvent);
  }

  void _onEvent(SignalEvent event) {
    switch (event) {
      case WelcomeEvent(:final peers):
        setState(() {
          _peers
            ..clear()
            ..addAll(peers);
          _status = _ChatStatus.connected;
        });
        for (final peer in peers) {
          unawaited(_mesh?.addPeer(peer));
        }
      case PeerJoinedEvent(:final peerId):
        setState(() {
          if (!_peers.contains(peerId)) _peers.add(peerId);
        });
        unawaited(_mesh?.addPeer(peerId));
      case PeerLeftEvent(:final peerId):
        setState(() {
          _peers.remove(peerId);
          _connections.remove(peerId);
        });
        unawaited(_mesh?.removePeer(peerId));
      case SignalRelayEvent(:final from, :final data):
        unawaited(_mesh?.handleSignal(from, data));
      case SignalClosedEvent(:final code):
        if (_status == _ChatStatus.connected) {
          setState(() {
            _status = _ChatStatus.error;
            _errorMessage = 'Disconnected from the room.';
          });
        } else {
          setState(() {
            _status = _ChatStatus.error;
            _errorMessage = _closeReason(code);
          });
        }
    }
  }

  String _closeReason(int code) {
    switch (code) {
      case 4404:
        return 'Room not found. It may have expired or the code is wrong.';
      case 4400:
        return 'Invalid display name.';
      case 4409:
        return 'Display name already in use in this room.';
      case 4408:
        return 'Room expired.';
      default:
        return 'Could not connect to the backend.';
    }
  }

  String _formatTime(DateTime now) {
    final h = now.hour.toString().padLeft(2, '0');
    final m = now.minute.toString().padLeft(2, '0');
    final s = now.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  void _addMessage({
    required bool self,
    required String author,
    required String text,
  }) {
    setState(() {
      _messages.add(_ChatMessage(
        self: self,
        author: author,
        time: _formatTime(DateTime.now()),
        text: text,
      ));
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  void _sendMessage(String text) {
    if (_mesh == null) return;
    _addMessage(self: true, author: widget.displayName, text: text);
    _mesh!.broadcast(text);
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result == null || result.files.isEmpty) return;
    final file = result.files.single;
    final bytes = file.bytes;
    if (bytes == null) return;

    final connected = _peers
        .where((p) => _connections[p] == true)
        .toList(growable: false);
    if (!mounted) return;
    if (connected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No peer connected to send a file to.')),
      );
      return;
    }

    String? peer;
    if (connected.length == 1) {
      peer = connected.first;
    } else {
      peer = await showDialog<String>(
        context: context,
        builder: (ctx) => SimpleDialog(
          title: const Text('Send file to'),
          backgroundColor: AshColors.surfaceContainer,
          children: [
            for (final p in connected)
              SimpleDialogOption(
                onPressed: () => Navigator.of(ctx).pop(p),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(p, style: AshText.bodyMd(AshColors.onSurface)),
                ),
              ),
          ],
        ),
      );
    }
    if (peer == null || !mounted) return;
    _mesh?.sendFile(peer, file.name, bytes);
    _addMessage(
      self: true,
      author: widget.displayName,
      text: 'Sent file · ${file.name}',
    );
  }

  void _acceptIncoming() {
    final file = _incomingFile;
    if (file == null) return;
    _mesh?.acceptFile(file['from'] as String, file['id'] as String);
    setState(() => _incomingFile = null);
  }

  void _declineIncoming() {
    final file = _incomingFile;
    if (file == null) return;
    _mesh?.declineFile(file['from'] as String, file['id'] as String);
    setState(() => _incomingFile = null);
  }

  Future<void> _saveIncoming(String name, Uint8List bytes) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/$name');
      await file.writeAsBytes(bytes, flush: true);
      if (mounted) {
        _addMessage(
          self: false,
          author: 'System',
          text: 'Received file · $name',
        );
      }
    } catch (_) {
      // ignore save failures
    }
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      barrierColor: AshColors.surfaceContainerLowest.withValues(alpha: 0.8),
      builder: (_) => const LeaveDialog(),
    );
    if (leave == true && mounted) {
      unawaited(_mesh?.close());
      _signaling?.close();
      if (Navigator.of(context).canPop()) Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    unawaited(_mesh?.close());
    _signaling?.close();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connected = _status == _ChatStatus.connected;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 680),
            child: Column(
              children: [
                ChatHeader(
                  onBack: () => Navigator.of(context).pop(),
                  displayName: widget.displayName,
                  connected: connected,
                ),
                ChannelBar(
                  roomId: widget.roomId,
                  peerCount: _connectedCount,
                  connected: connected,
                  onLeave: _confirmLeave,
                ),
                if (_incomingFile != null) _IncomingFileBar(
                  name: _incomingFile!['name'] as String,
                  onAccept: _acceptIncoming,
                  onDecline: _declineIncoming,
                ),
                if (_transfers.isNotEmpty)
                  _TransfersPanel(
                    transfers: _transfers.values.toList(growable: false),
                    onCancel: (item) {
                      _mesh?.cancelFile(item.peerId, item.id);
                      setState(() => _transfers.remove(item.key));
                    },
                  ),
                if (_status == _ChatStatus.error) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AshColors.errorContainer.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.link_off,
                              size: 16, color: AshColors.error),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage ?? 'Connection error.',
                              style: AshText.bodySm(AshColors.error),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                Expanded(
                  child: ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    children: [
                      for (var i = 0; i < _messages.length; i++) ...[
                        _messages[i].self
                            ? SelfMessageBubble(
                                time: _messages[i].time,
                                text: _messages[i].text,
                                delivered: true,
                              )
                            : PeerBubble(
                                initial: _messages[i].author.isEmpty
                                    ? '?'
                                    : _messages[i].author[0].toUpperCase(),
                                initialColor: AshColors.tertiary,
                                time: _messages[i].time,
                                text: _messages[i].text,
                                peerLabel: _messages[i].author,
                              ),
                        if (i != _messages.length - 1)
                          const SizedBox(height: 16),
                      ],
                      if (_messages.isEmpty) ...[
                        const EmptyStateDivider(),
                        const SizedBox(height: 16),
                      ],
                    ],
                  ),
                ),
                Composer(onSend: _sendMessage, onAttach: _pickFile),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IncomingFileBar extends StatelessWidget {
  const _IncomingFileBar({
    required this.name,
    required this.onAccept,
    required this.onDecline,
  });

  final String name;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AshColors.surfaceContainer,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            const Icon(Icons.insert_drive_file, size: 18, color: AshColors.tint),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Incoming file · $name',
                overflow: TextOverflow.ellipsis,
                style: AshText.bodyMd(AshColors.onSurface),
              ),
            ),
            TextButton(onPressed: onDecline, child: const Text('Decline')),
            TextButton(onPressed: onAccept, child: const Text('Accept')),
          ],
        ),
      ),
    );
  }
}

class _TransfersPanel extends StatelessWidget {
  const _TransfersPanel({required this.transfers, required this.onCancel});

  final List<_TransferItem> transfers;
  final void Function(_TransferItem) onCancel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final t in transfers) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AshColors.surfaceContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          t.name,
                          overflow: TextOverflow.ellipsis,
                          style: AshText.bodyMd(AshColors.onSurface),
                        ),
                      ),
                      IconButton(
                        iconSize: 18,
                        visualDensity: VisualDensity.compact,
                        color: AshColors.outline,
                        onPressed: () => onCancel(t),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: t.size > 0 ? (t.sent / t.size).clamp(0.0, 1.0) : 0,
                    color: AshColors.tint,
                    backgroundColor: AshColors.surfaceContainerHigh,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${t.isSend ? 'Sending' : 'Receiving'} · '
                    '${(t.sent * 100 / (t.size == 0 ? 1 : t.size)).toStringAsFixed(0)}%',
                    style: AshText.codeSm(AshColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}