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

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', body.taskId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (taskError) throw taskError
    if (!task) return error('Задача не найдена', 404)

    const { error: upsertError } = await supabase
      .from('task_completions')
      .upsert(
        { user_id: user.id, task_id: body.taskId, date: body.date },
        { onConflict: 'task_id,date', ignoreDuplicates: true },
      )

    if (upsertError) throw upsertError

    return json({ ok: true, completed: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось отметить задачу'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})