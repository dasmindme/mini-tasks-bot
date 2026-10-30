import { getInitData } from '../telegram/telegram'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function callFunction(name, payload = {}) {
  if (!hasSupabaseConfig()) {
    throw new Error(
      'Не настроены VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY',
    )
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ ...payload, initData: getInitData() }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // Non-JSON response, fall through to status-based error.
  }

  if (!response.ok) {
    throw new Error(data?.error || `Ошибка запроса (${response.status})`)
  }

  return data
}