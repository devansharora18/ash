// Application-layer end-to-end encryption.
//
// Hybrid asymmetric model ("lock" with a public key, "unlock" with a private
// key that is never shared):
//   - each device has a long-lived ECDH (P-256) keypair persisted in the browser
//   - every message gets a fresh random AES-GCM data key; the payload is
//     encrypted once with it
//   - the data key itself is wrapped (encrypted) to each recipient's public key
//   - only a device holding the matching private key can unwrap and decrypt
//
// Honest limits: this is application-level E2EE on top of WebRTC DTLS. The
// device key is long-lived (no forward-secret ratcheting yet) and public keys
// are trusted on first use (no manual fingerprint cross-check yet).

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' }
const AES_GCM = { name: 'AES-GCM' }
const IV_LENGTH = 12

const PRIV_KEY = 'ash.e2ee.identity'
const PUB_KEY = 'ash.e2ee.pub'

export interface WrappedKey {
  /** reader public key (base64) this wrapped data key is encrypted to */
  r: string
  /** AES-GCM wrapped data key: iv || ciphertext (base64) */
  w: string
}

export interface Envelope {
  v: 1
  /** sender public key (base64) */
  sender: string
  /** content ciphertext IV (base64) */
  nonce: string
  /** AES-GCM(content), keyed by the data key (base64) */
  ciphertext: string
  /** the data key, wrapped to each intended reader */
  keys: WrappedKey[]
}

export interface Identity {
  priv: CryptoKey
  pubB64: string
}

function bufToB64(buf: Uint8Array): string {
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return btoa(s)
}

function b64ToBuf(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Derive an AES key from the shared ECDH secret between my private key and a peer public key. */
async function deriveAesKey(
  myPriv: CryptoKey,
  peerPubRaw: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const peerPub = await crypto.subtle.importKey('raw', peerPubRaw, ECDH_PARAMS, false, [])
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPub }, myPriv, 256)
  return crypto.subtle.importKey('raw', bits, AES_GCM, false, [
    'encrypt',
    'decrypt',
    'wrapKey',
    'unwrapKey',
  ])
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
  localStorage.setItem(PRIV_KEY, JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey)))
  const pubB64 = bufToB64(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))
  localStorage.setItem(PUB_KEY, pubB64)
  return { priv: pair.privateKey, pubB64 }
}

/**
 * Seal `payload` so that every `recipientsB64` public key (and, implicitly, the
 * sender) can open it. Returns an envelope ready for the wire.
 */
export async function seal(
  identity: Identity,
  payload: Uint8Array<ArrayBuffer>,
  recipientsB64: string[],
): Promise<Envelope> {
  const dataKey = await crypto.subtle.generateKey({ ...AES_GCM, length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const nonce = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ ...AES_GCM, iv: nonce }, dataKey, payload),
  )

  const keys: WrappedKey[] = []
  for (const readerB64 of recipientsB64) {
    const wrappingKey = await deriveAesKey(identity.priv, b64ToBuf(readerB64))
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const wrapped = new Uint8Array(
      await crypto.subtle.wrapKey('raw', dataKey, wrappingKey, { ...AES_GCM, iv }),
    )
    keys.push({ r: readerB64, w: bufToB64(new Uint8Array([...iv, ...wrapped])) })
  }

  return {
    v: 1,
    sender: identity.pubB64,
    nonce: bufToB64(nonce),
    ciphertext: bufToB64(ciphertext),
    keys,
  }
}

/** Open `env` if it was sealed to `identity`; otherwise null. */
export async function unseal(
  identity: Identity,
  env: Envelope,
): Promise<Uint8Array | null> {
  const entry = env.keys.find((k) => k.r === identity.pubB64)
  if (!entry) return null
  const wrapped = b64ToBuf(entry.w)
  const iv = wrapped.slice(0, IV_LENGTH)
  const wrappedCt = wrapped.slice(IV_LENGTH)

  const unwrappingKey = await deriveAesKey(identity.priv, b64ToBuf(env.sender))
  const dataKey = await crypto.subtle.unwrapKey(
    'raw',
    wrappedCt,
    unwrappingKey,
    { ...AES_GCM, iv },
    { ...AES_GCM, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  const plain = await crypto.subtle.decrypt(
    { ...AES_GCM, iv: b64ToBuf(env.nonce) },
    dataKey,
    b64ToBuf(env.ciphertext),
  )
  return new Uint8Array(plain)
}
