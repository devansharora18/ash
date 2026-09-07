// Application-layer end-to-end encryption.
//
// Asymmetric "lock/unlock" model:
//   - each device holds a long-lived ECDH (P-256) keypair persisted in the
//     browser; the public key is shared with peers, the private key never
//     leaves the device
//   - a per-peer AES-GCM session key is derived from the shared ECDH secret:
//       sessionKey = f(myPrivateKey, peerPublicKey) == f(peerPrivateKey, myPublicKey)
//     both sides compute the same key independently; no key material is shared
//   - all content (chat, file, voice, whiteboard) is encrypted with that
//     session key, giving fast, low-overhead E2EE on top of WebRTC DTLS
//
// Honest limits: the private key is long-lived (no forward-secret ratcheting)
// and the session key is a shared symmetric key derived from static ECDH, so
// there is no per-message forward secrecy. Public keys are trusted on first use.

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' }
const AES_GCM = { name: 'AES-GCM' }

const PRIV_KEY = 'ash.e2ee.identity'
const PUB_KEY = 'ash.e2ee.pub'

export interface Identity {
  priv: CryptoKey
  pubB64: string
}

export function bufToB64(buf: Uint8Array): string {
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s)
}

export function b64ToBuf(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Load the device keypair from storage, or create + persist a new one. */
export async function loadOrCreateIdentity(): Promise<Identity> {
  const storedPriv = localStorage.getItem(PRIV_KEY)
  const storedPub = localStorage.getItem(PUB_KEY)
  if (storedPriv && storedPub) {
    try {
      const priv = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(storedPriv),
        ECDH_PARAMS,
        false,
        ['deriveBits'],
      )
      return { priv, pubB64: storedPub }
    } catch {
      // corrupt key -> regenerate below
    }
  }
  const pair = await crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveBits'])
  localStorage.setItem(
    PRIV_KEY,
    JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey)),
  )
  const pubB64 = bufToB64(
    new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)),
  )
  localStorage.setItem(PUB_KEY, pubB64)
  return { priv: pair.privateKey, pubB64 }
}

/**
 * Derive the shared AES-GCM session key between my private key and a peer's
 * public key. The peer derives the identical key from their private key and
 * my public key; nether private key is ever transmitted.
 */
export async function deriveSessionKey(
  identity: Identity,
  peerPubB64: string,
): Promise<CryptoKey> {
  const peerPub = await crypto.subtle.importKey(
    'raw',
    b64ToBuf(peerPubB64),
    ECDH_PARAMS,
    false,
    [],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPub },
    identity.priv,
    256,
  )
  return crypto.subtle.importKey('raw', bits, AES_GCM, false, [
    'encrypt',
    'decrypt',
  ])
}

export function newNonce(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(12))
}

export async function encryptBlock(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.encrypt({ ...AES_GCM, iv }, key, data))
}

export async function decryptBlock(
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.decrypt({ ...AES_GCM, iv }, key, data))
}
