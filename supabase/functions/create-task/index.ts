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

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        title,
        type: body.type,
        task_date: taskDate,
      })
      .select('id, title, category_id, type, task_date, is_active')
      .single()

    if (insertError) throw insertError

    return json({ task }, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Не удалось создать задачу'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})