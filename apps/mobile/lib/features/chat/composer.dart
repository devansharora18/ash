import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../../theme.dart';

const _maxVoiceSeconds = 5 * 60;

class Composer extends StatefulWidget {
  const Composer({
    super.key,
    required this.onSend,
    this.onAttach,
    this.onVoice,
  });

  final void Function(String text) onSend;
  final VoidCallback? onAttach;
  final void Function(Uint8List bytes, int durationSec)? onVoice;

  @override
  State<Composer> createState() => _ComposerState();
}

class _ComposerState extends State<Composer> {
  final _controller = TextEditingController();
  final _recorder = AudioRecorder();
  final _stopwatch = Stopwatch();
  Timer? _ticker;
  String? _recordingPath;

  bool _recording = false;
  bool _recorded = false;
  int _elapsedSec = 0;
  Uint8List? _recordingBytes;

  bool get _hasText => _controller.text.trim().isNotEmpty;

  @override
  void dispose() {
    _controller.dispose();
    _ticker?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  void _send() {
    if (!_hasText) return;
    widget.onSend(_controller.text.trim());
    _controller.clear();
    setState(() {});
  }

  Future<void> _startRecording() async {
    if (_recording || _recorded) return;
    if (!await _recorder.hasPermission()) return;
    if (!mounted) return;
    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/rec_${DateTime.now().millisecondsSinceEpoch}.m4a';
    _recordingPath = path;
    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 44100),
      path: path,
    );
    _stopwatch
      ..reset()
      ..start();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsedSec = _stopwatch.elapsed.inSeconds);
      if (_elapsedSec >= _maxVoiceSeconds) _stopRecording();
    });
    setState(() {
      _recording = true;
      _recorded = false;
      _elapsedSec = 0;
    });
  }

  Future<void> _stopRecording() async {
    if (!_recording) return;
    _ticker?.cancel();
    _stopwatch.stop();
    final path = await _recorder.stop();
    _recordingPath = null;
    final bytes = path != null ? await File(path).readAsBytes() : null;
    if (path != null) {
      try {
        await File(path).delete();
      } catch (_) {}
    }
    final durationSec = _stopwatch.elapsed.inSeconds.clamp(0, _maxVoiceSeconds);
    if (bytes != null && bytes.isNotEmpty && durationSec >= 1 && mounted) {
      _recordingBytes = bytes;
      setState(() {
        _recording = false;
        _recorded = true;
        _elapsedSec = durationSec;
      });
    } else {
      setState(() {
        _recording = false;
        _recorded = false;
        _elapsedSec = 0;
      });
    }
  }

  void _cancelRecording() {
    _ticker?.cancel();
    _stopwatch.stop();
    final path = _recordingPath;
    _recordingPath = null;
    if (path != null) {
      try {
        File(path).deleteSync();
      } catch (_) {}
    }
    _recorder.cancel();
    setState(() {
      _recording = false;
      _recorded = false;
      _elapsedSec = 0;
      _recordingBytes = null;
    });
  }

  void _sendRecorded() {
    final bytes = _recordingBytes;
    if (bytes == null) return;
    widget.onVoice?.call(bytes, _elapsedSec);
    setState(() {
      _recorded = false;
      _recordingBytes = null;
      _elapsedSec = 0;
    });
  }

  String _format(int sec) {
    final m = (sec ~/ 60).toString();
    final s = (sec % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AshColors.surfaceContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_recording || _recorded) _buildRecordingBar() else _buildInputRow(),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AshColors.tertiary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'RAM-only queue: 3 pkts',
                        style: AshText.codeSm(AshColors.onSurfaceVariant),
                      ),
                    ],
                  ),
                  Text('TTL: 180s', style: AshText.codeSm(AshColors.outline)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputRow() {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: widget.onAttach,
            child: const Icon(
              Icons.attach_file,
              size: 20,
              color: AshColors.outline,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AshColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: _recording || _recorded ? null : _startRecording,
            child: Icon(
              Icons.mic_none,
              size: 22,
              color: _recording || _recorded ? AshColors.outline : AshColors.tint,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AshColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.centerLeft,
            child: TextField(
              controller: _controller,
              onChanged: (_) => setState(() {}),
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              style: AshText.bodyMd(AshColors.onSurface),
              cursorColor: AshColors.tint,
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: 'Write an encrypted message...',
                hintStyle: AshText.bodyMd(AshColors.outline),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: _hasText ? _send : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _hasText
                    ? AshColors.tint
                    : AshColors.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.arrow_upward,
                size: 20,
                color: _hasText ? AshColors.onPrimaryFixed : AshColors.outline,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecordingBar() {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _recording
                ? AshColors.error.withValues(alpha: 0.18)
                : AshColors.surfaceContainerHigh,
          ),
          child: Icon(
            Icons.graphic_eq,
            size: 22,
            color: _recording ? AshColors.error : AshColors.tint,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _format(_elapsedSec),
                style: AshText.codeMd(AshColors.onSurface),
              ),
              Text(
                _recorded ? 'Ready to send' : 'Recording… max 5 min',
                style: AshText.bodySm(AshColors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        TextButton(onPressed: _cancelRecording, child: const Text('Cancel')),
        TextButton(
          onPressed: _recorded ? _sendRecorded : _stopRecording,
          child: Text(_recorded ? 'Send' : 'Stop'),
        ),
      ],
    );
  }
}
