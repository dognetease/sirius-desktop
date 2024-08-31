const MEDIA_HKDF_KEY_MAPPING: Record<string, string> = {
  audio: 'Audio',
  document: 'Document',
  gif: 'Video',
  image: 'Image',
  ppic: '',
  product: 'Image',
  ptt: 'Audio',
  sticker: 'Image',
  video: 'Video',
  'thumbnail-document': 'Document Thumbnail',
  'thumbnail-image': 'Image Thumbnail',
  'thumbnail-video': 'Video Thumbnail',
  'thumbnail-link': 'Link Thumbnail',
  'md-msg-hist': 'History',
  'md-app-state': 'App State',
  'product-catalog-image': '',
  'payment-bg-image': 'Payment Background',
};

const AES_CHUNK_SIZE = 16;
const toSmallestChunkSize = (num: number) => Math.floor(num / AES_CHUNK_SIZE) * AES_CHUNK_SIZE;

export function b64ToBuffer(b64: string) {
  b64 = b64.replace(/_/g, '/').replace(/-/g, '+');
  b64 += '==='.slice((b64.length + 3) % 4);
  const b = atob(b64)
    .split('')
    .map(s => s.charCodeAt(0));
  return new Uint8Array(b);
}

export async function hkdf(key: string, info: string, length: number = 112 * 8) {
  const bufferKey = b64ToBuffer(key);
  const baseKey = await crypto.subtle.importKey('raw', bufferKey, 'HKDF', false, ['deriveKey']);

  const deriveKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', info: new TextEncoder().encode(info), hash: 'SHA-256', salt: new Uint8Array(0) },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256', length },
    true,
    ['sign']
  );
  return crypto.subtle.exportKey('raw', deriveKey);
}

function getMediaKeys(mediaKey: string, mediaType: string) {
  const type = MEDIA_HKDF_KEY_MAPPING[mediaType] || mediaType.slice(0, 1).toUpperCase() + mediaType.slice(1);
  return hkdf(mediaKey, `WhatsApp ${type} Keys`);
}

export default async function decryptMedia(buffer: ArrayBuffer, mediaKey: string, mediaType: string) {
  const hkdfKey = await getMediaKeys(mediaKey, mediaType);
  const iv = hkdfKey.slice(0, 16);
  const cipherKey = hkdfKey.slice(16, 48);
  const decryptLegnth = toSmallestChunkSize(buffer.byteLength);

  const key = await crypto.subtle.importKey(
    'raw',
    cipherKey,
    {
      name: 'AES-CBC',
      length: 256,
    },
    false,
    ['decrypt']
  );

  return crypto.subtle.decrypt({ name: 'AES-CBC', iv, length: 256 }, key, buffer.slice(0, decryptLegnth));
}
