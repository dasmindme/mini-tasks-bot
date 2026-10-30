import { authenticate } from '../_shared/auth.ts'
import {
  error,
  handleOptions,
  isValidDate,
  json,
  readJson,
} from '../_shared/http.ts'

interface Body {
  initData?: string
  taskId?: string
  date?: string
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  if (req.method !== 'POST') {
    return error('Метод не поддерживается', 405)
  }

  try {
    const body = await readJson<Body>(req)
    const { user, supabase } = await authenticate(body.initData)

    if (!body.taskId) return error('Не указана задача')
    if (!isValidDate(body.date)) return error('Нужна корректная дата')

    const { error: deleteError } = await supabase
      .from('task_completions')
      .delete()
      .eq('task_id', body.taskId)
      .eq('user_id', user.id)
      .eq('date', body.date)

    if (deleteError) throw deleteError

    return json({ ok: true, completed: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось снять отметку'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})