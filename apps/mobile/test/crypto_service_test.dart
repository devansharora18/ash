import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:ash_mobile/services/crypto_service.dart';

BigInt _b64urlToBigInt(String s) {
  final padded = s + '=' * ((4 - s.length % 4) % 4);
  var v = BigInt.zero;
  for (final x in base64Url.decode(padded)) {
    v = (v << 8) | BigInt.from(x);
  }
  return v;
}

String _hex(Uint8List b) => b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();

void main() {
  test('ECDH + AES-GCM interoperates with the WebCrypto reference', () {
    // Reference vector produced by WebCrypto (Node). Identity A's private
    // scalar d, deriving a session key with peer B, decrypting B's ciphertext.
    final privA = _b64urlToBigInt('gBf9pgeuNQ7fKlvSEiOKyWAgNBH6pt33D1z7WgoxWiA');
    final id = Identity(
      privScalar: privA,
      pubB64:
          'BOb+SMePmY/IZeAc3swCvyOJ+6P7+IpXLycDO9T11xMamv8ZTjAH4R8Kw+uwaF4qnFeSpphspbPPjtknM3zLpgw=',
    );
    final peerPubB =
        'BDMQ0youfKvap26UbfLJYCUNpqAzNdW2kmfCD2KyIaaORdKTCXJqIyRjXKQfOCl3OWUh+L2rFvRI7dC4tcI5HSU=';

    final key = deriveSessionKey(id, peerPubB);
    expect(
      _hex(key),
      '54d411cf8995afea46ed7397cc98f8aaf4f279097af81d3b1e09bee59634b7f4',
    );

    final nonce = Uint8List.fromList(List.filled(12, 7));
    final ct = base64Decode(
      'IpXPF7OhzaEvJTy/nTVaWr3xYgymOgE2HUH6GEwxsTVkL0KDqsQ=',
    );
    final plain = decryptBlock(key, nonce, ct);
    expect(utf8.decode(plain), 'ash interoperable e2ee');

    // Local round-trip.
    final ciphertext = encryptBlock(key, nonce, utf8.encode('hello'));
    expect(utf8.decode(decryptBlock(key, nonce, ciphertext)), 'hello');
  });
}