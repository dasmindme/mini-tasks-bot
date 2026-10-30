export interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
  is_premium?: boolean
}

export interface VerifiedInitData {
  user: TelegramUser
  authDate: number
  params: URLSearchParams
}

const encoder = new TextEncoder()

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message),
  )
  return new Uint8Array(signature)
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Validates Telegram Mini App initData using the algorithm from
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export async function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24,
): Promise<VerifiedInitData> {
  if (!initData || typeof initData !== 'string') {
    throw new Error('Отсутствует initData')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) {
    throw new Error('В initData нет подписи')
  }

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = await hmacSha256(encoder.encode('WebAppData'), botToken)
  const calculatedHash = toHex(await hmacSha256(secretKey, dataCheckString))

  if (!safeEqual(calculatedHash, hash.toLowerCase())) {
    throw new Error('Неверная подпись initData')
  }

  const authDate = Number(params.get('auth_date'))
  if (!authDate || Number.isNaN(authDate)) {
    throw new Error('В initData нет auth_date')
  }
  if (Date.now() / 1000 - authDate > maxAgeSeconds) {
    throw new Error('initData устарела, откройте приложение заново')
  }

  let user: TelegramUser | null = null
  try {
    user = JSON.parse(params.get('user') || 'null')
  } catch {
    throw new Error('Не удалось прочитать пользователя из initData')
  }

  if (!user || typeof user.id !== 'number') {
    throw new Error('В initData нет пользователя')
  }

  return { user, authDate, params }
}