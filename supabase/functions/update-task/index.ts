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
  title?: string
  categoryId?: string | null
  type?: string
  date?: string | null
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

    const { data: existing, error: existingError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', body.taskId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingError) throw existingError
    if (!existing) return error('Задача не найдена', 404)

    const title = (body.title ?? '').trim()
    if (!title) return error('Введите название задачи')
    if (title.length > 200) return error('Название слишком длинное')

    if (body.type !== 'once' && body.type !== 'daily') {
      return error('Тип задачи должен быть once или daily')
    }

    let taskDate: string | null = null
    if (body.type === 'once') {
      if (!isValidDate(body.date)) {
        return error('Для разовой задачи нужна дата')
      }
      taskDate = body.date
    }

    let categoryId: string | null = null
    if (body.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', body.categoryId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (categoryError) throw categoryError
      if (!category) return error('Категория не найдена', 404)
      categoryId = category.id
    }

    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({
        title,
        category_id: categoryId,
        type: body.type,
        task_date: taskDate,
      })
      .eq('id', body.taskId)
      .eq('user_id', user.id)
      .select('id, title, category_id, type, task_date, is_active')
      .single()

    if (updateError) throw updateError

    return json({ task })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось обновить задачу'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})