import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { verifyInitData, type TelegramUser } from './telegram.ts'

export interface AppUser {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  language_code: string | null
  timezone: string | null
  reminders_enabled: boolean
  reminder_time: string | null
  created_at: string
  updated_at: string
}

export interface AuthResult {
  user: AppUser
  supabase: SupabaseClient
}

const DEFAULT_CATEGORIES = [
  { title: 'Красота', icon: '♡', sort_order: 1 },
  { title: 'Быт', icon: '🧺', sort_order: 2 },
  { title: 'Саморазвитие', icon: '✦', sort_order: 3 },
  { title: 'Здоровье', icon: '◌', sort_order: 4 },
]

function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error('Не настроены SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function insertPayload(telegramUser: TelegramUser) {
  return {
    telegram_id: telegramUser.id,
    username: telegramUser.username ?? null,
    first_name: telegramUser.first_name ?? null,
    language_code: telegramUser.language_code ?? null,
  }
}

async function findOrCreateUser(
  supabase: SupabaseClient,
  telegramUser: TelegramUser,
): Promise<{ user: AppUser; isNew: boolean }> {
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramUser.id)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return { user: existing as AppUser, isNew: false }

  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert(insertPayload(telegramUser))
    .select('*')
    .single()

  if (insertError) {
    // Another request may have created the same user concurrently.
    if ((insertError as { code?: string }).code === '23505') {
      const { data: raced, error: racedError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single()
      if (racedError) throw racedError
      return { user: raced as AppUser, isNew: false }
    }
    throw insertError
  }

  return { user: created as AppUser, isNew: true }
}

/**
 * Verifies Telegram initData, then returns (or creates) the app user.
 * The returned client uses the service role key and bypasses RLS, so every
 * query must explicitly filter by user.id.
 */
export async function authenticate(initData: unknown): Promise<AuthResult> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!botToken) {
    throw new Error('Не настроен TELEGRAM_BOT_TOKEN')
  }
  if (typeof initData !== 'string') {
    throw new Error('Отсутствует initData')
  }

  const { user: telegramUser } = await verifyInitData(initData, botToken)
  const supabase = adminClient()
  const { user, isNew } = await findOrCreateUser(supabase, telegramUser)

  if (isNew) {
    const { error: categoriesError } = await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        user_id: user.id,
      })),
    )
    if (categoriesError) throw categoriesError
  }

  return { user, supabase }
}