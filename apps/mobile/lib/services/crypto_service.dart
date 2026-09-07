import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:pointycastle/api.dart';
import 'package:pointycastle/block/aes.dart';
import 'package:pointycastle/block/modes/gcm.dart';
import 'package:pointycastle/ecc/api.dart';
import 'package:pointycastle/ecc/curves/secp256r1.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Application-layer end-to-end encryption, wire-compatible with the web client.
//
// Each device holds an ECDH (P-256) keypair; the private scalar `d` never
// leaves the device. A per-peer AES-GCM session key is derived from the shared
// ECDH secret x-coordinate (raw, matching WebCrypto's deriveBits output):
//
//    sessionKey = x( d_self * Pub_peer )  ==  x( d_peer * Pub_self )
//
// All content (chat, file, voice, whiteboard) is encrypted with that session
// key. Frames are `{kind:'esc', nonce:base64(12), ct:base64(cipher+mac)}` and
// binary chunks are `[nonce(12) || cipher+mac]`.

class Identity {
  Identity({required this.privScalar, required this.pubB64});

  final BigInt privScalar;
  final String pubB64;
}

final _spec = ECCurve_secp256r1();

const _privKeyPrefs = 'ash.e2ee.priv';
const _pubKeyPrefs = 'ash.e2ee.pub';

Uint8List _bigIntToBytes(BigInt v, int length) {
  final hex = v.toRadixString(16).padLeft(length * 2, '0');
  final out = Uint8List(length);
  for (var i = 0; i < length; i++) {
    out[i] = int.parse(hex.substring(i * 2, i * 2 + 2), radix: 16);
  }
  return out;
}

BigInt _bytesToBigInt(Uint8List b) {
  var v = BigInt.zero;
  for (final byte in b) {
    v = (v << 8) | BigInt.from(byte);
  }
  return v;
}

Future<Identity> loadOrCreateIdentity() async {
  final prefs = await SharedPreferences.getInstance();
  final privB64 = prefs.getString(_privKeyPrefs);
  final pubB64 = prefs.getString(_pubKeyPrefs);
  if (privB64 != null && pubB64 != null) {
    try {
      final d = _bytesToBigInt(base64Decode(privB64));
      return Identity(privScalar: d, pubB64: pubB64);
    } catch (_) {
      // corrupt -> regenerate below
    }
  }

  final rng = Random.secure();
  final d = _randomScalar(rng);
  final q = _spec.G * d;
  final pub = q!;
  final pubBytes = _encodePoint(pub);
  final pubEncoded = base64Encode(pubBytes);
  await prefs.setString(_privKeyPrefs, base64Encode(_bigIntToBytes(d, 32)));
  await prefs.setString(_pubKeyPrefs, pubEncoded);
  return Identity(privScalar: d, pubB64: pubEncoded);
}

BigInt _randomScalar(Random rng) {
  final n = _spec.n;
  while (true) {
    final bytes = Uint8List.fromList(
      List<int>.generate(32, (_) => rng.nextInt(256)),
    );
    final candidate = _bytesToBigInt(bytes);
    if (candidate.sign > 0 && candidate < n) return candidate;
  }
}

Uint8List _encodePoint(ECPoint p) {
  final out = Uint8List(65);
  out[0] = 4; // uncompressed marker
  out.setRange(1, 33, _bigIntToBytes(p.x!.toBigInteger()!, 32));
  out.setRange(33, 65, _bigIntToBytes(p.y!.toBigInteger()!, 32));
  return out;
}

ECPoint? _decodePoint(Uint8List bytes) {
  return _spec.curve.decodePoint(bytes);
}

/// Derive the raw 32-byte ECDH shared secret between my scalar and a peer's
/// public key (base64 65-byte uncompressed point), matching WebCrypto.
Uint8List deriveSessionKey(Identity identity, String peerPubB64) {
  final peerBytes = base64Decode(peerPubB64);
  final q = _decodePoint(peerBytes);
  if (q == null) throw DecryptFailure();
  final agreement = ECDHBasicAgreement()
    ..init(ECPrivateKey(identity.privScalar, _spec));
  final x = agreement.calculateAgreement(ECPublicKey(q, _spec));
  return _bigIntToBytes(x, 32);
}

Uint8List newNonce() {
  final rng = Random.secure();
  return Uint8List.fromList(List<int>.generate(12, (_) => rng.nextInt(256)));
}

/// AES-GCM encrypt (12-byte nonce, 128-bit tag). Output = ciphertext + mac.
Uint8List encryptBlock(Uint8List key, Uint8List nonce, Uint8List plain) {
  final gcm = GCMBlockCipher(AESEngine())
    ..init(
      true,
      AEADParameters(KeyParameter(key), 128, nonce, Uint8List(0)),
    );
  final out = Uint8List(plain.length + 16);
  var off = gcm.processBytes(plain, 0, plain.length, out, 0);
  off += gcm.doFinal(out, off);
  return Uint8List.sublistView(out, 0, off);
}

/// AES-GCM decrypt; throws [DecryptFailure] on auth failure (bad key/tamper).
Uint8List decryptBlock(Uint8List key, Uint8List nonce, Uint8List ct) {
  final gcm = GCMBlockCipher(AESEngine())
    ..init(
      false,
      AEADParameters(KeyParameter(key), 128, nonce, Uint8List(0)),
    );
  final out = Uint8List(ct.length);
  try {
    var off = gcm.processBytes(ct, 0, ct.length, out, 0);
    off += gcm.doFinal(out, off);
    return Uint8List.sublistView(out, 0, off);
  } on StateError {
    throw DecryptFailure();
  } on ArgumentError {
    throw DecryptFailure();
  }
}

class DecryptFailure implements Exception {}