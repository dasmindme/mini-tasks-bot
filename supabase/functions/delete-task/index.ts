import { authenticate } from '../_shared/auth.ts'
import { error, handleOptions, json, readJson } from '../_shared/http.ts'

interface Body {
  initData?: string
  taskId?: string
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

    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({ is_active: false })
      .eq('id', body.taskId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select('id')
      .maybeSingle()

    if (updateError) throw updateError
    if (!task) return error('Задача не найдена', 404)

    return json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось удалить задачу'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})