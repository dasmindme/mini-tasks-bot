import { authenticate } from '../_shared/auth.ts'
import {
  error,
  handleOptions,
  json,
  readJson,
} from '../_shared/http.ts'

interface Body {
  initData?: string
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  if (req.method !== 'POST') {
    return error('Метод не поддерживается', 405)
  }

  try {
    const { initData } = await readJson<Body>(req)
    const { user } = await authenticate(initData)

    return json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        username: user.username,
        language_code: user.language_code,
        timezone: user.timezone,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка авторизации'
    const status = /initData|подпис|Telegram/i.test(message) ? 401 : 400
    return error(message, status)
  }
})