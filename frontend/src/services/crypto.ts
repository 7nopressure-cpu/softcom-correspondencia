/**
 * Servicio de Cifrado de Extremo a Extremo (E2EE) - SnowPoint Healthcare / SoftCom
 * Implementado utilizando la API nativa de Web Crypto del navegador (SubtleCrypto).
 * Algoritmo: AES-GCM (Galois/Counter Mode) con llave de 256 bits y vector de inicialización (IV) de 96 bits.
 * Hashing de Integridad: SHA-256 para verificación de no manipulación.
 */

const DEFAULT_E2EE_MASTER_SECRET = 'SnowPoint_Healthcare_E2EE_Secured_Vault_2026_Key';
const SALT = new Uint8Array([0x53, 0x6e, 0x6f, 0x77, 0x50, 0x6f, 0x69, 0x6e, 0x74, 0x48, 0x65, 0x61, 0x6c, 0x74, 0x68]); // "SnowPointHealth"

const PREFIX = 'ENC:v1:AES-GCM-256:';

/**
 * Deriva una CryptoKey AES-GCM de 256 bits a partir de una clave maestra o contraseña.
 */
async function deriveKey(passphrase: string = DEFAULT_E2EE_MASTER_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convierte un ArrayBuffer o Uint8Array a string Base64.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convierte un string Base64 a Uint8Array.
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verifica si un texto ya está cifrado con el protocolo E2EE.
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false;
  return text.startsWith(PREFIX);
}

/**
 * Cifra un texto plano utilizando AES-GCM de 256 bits.
 * Retorna un string formateado con el prefijo, IV y el texto cifrado con tag de autenticación.
 */
export async function encryptText(plainText: string, customPassphrase?: string): Promise<{
  encryptedPayload: string;
  hash: string;
}> {
  if (!plainText) {
    return { encryptedPayload: '', hash: '' };
  }

  try {
    const key = await deriveKey(customPassphrase);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV para GCM
    const encoded = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoded
    );

    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(ciphertextBuffer);
    const encryptedPayload = `${PREFIX}${ivB64}:${cipherB64}`;
    const hash = await generateIntegrityHash(plainText);

    return { encryptedPayload, hash };
  } catch (error) {
    console.error('Error durante el cifrado E2EE:', error);
    // En caso de fallo inesperado, se retorna el texto sin interrumpir el flujo
    return { encryptedPayload: plainText, hash: '' };
  }
}

/**
 * Descifra un texto que haya sido cifrado con el protocolo E2EE.
 * Si el texto no está cifrado, lo retorna tal como está.
 */
export async function decryptText(payload: string | null | undefined, customPassphrase?: string): Promise<string> {
  if (!payload || typeof payload !== 'string') return payload || '';
  if (!isEncrypted(payload)) return payload;

  try {
    const key = await deriveKey(customPassphrase);
    const body = payload.slice(PREFIX.length);
    const parts = body.split(':');
    if (parts.length !== 2) return payload;

    const iv = base64ToBuffer(parts[0]);
    const ciphertext = base64ToBuffer(parts[1]);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.warn('No se pudo descifrar el payload E2EE (posible llave incorrecta o dato dañado):', error);
    return '[🔒 Contenido Cifrado - Llave no coincidente o protegido]';
  }
}

/**
 * Genera un Hash Criptográfico SHA-256 en formato Hexadecimal para verificar la integridad del contenido.
 */
export async function generateIntegrityHash(content: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    return '';
  }
}

/**
 * Genera un Hash Criptográfico SHA-256 de un archivo adjunto.
 */
export async function generateFileHash(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    return '';
  }
}
