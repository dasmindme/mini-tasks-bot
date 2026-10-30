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
    if (!isValidDate(body.date)) {
      return error('Нужна корректная дата в формате YYYY-MM-DD')
    }

    const { user, supabase } = await authenticate(body.initData)
    const date = body.date

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, type, task_date, category_id, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or(`type.eq.daily,and(type.eq.once,task_date.eq.${date})`)
      .order('created_at', { ascending: true })

    if (tasksError) throw tasksError

    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('date', date)

    if (completionsError) throw completionsError

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, title, icon, sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (categoriesError) throw categoriesError

    const completedTaskIds = new Set(
      (completions ?? []).map((row) => row.task_id),
    )

    const categoriesById = new Map(
      (categories ?? []).map((category) => [category.id, category]),
    )

    const grouped = new Map<string, {
      id: string
      title: string
      icon: string
      sort_order: number
      tasks: Array<{
        id: string
        title: string
        type: 'once' | 'daily'
        task_date: string | null
        completed: boolean
      }>
    }>()

    for (const category of categories ?? []) {
      grouped.set(category.id, {
        id: category.id,
        title: category.title,
        icon: category.icon ?? '♡',
        sort_order: category.sort_order ?? 0,
        tasks: [],
      })
    }

    const uncategorizedKey = '__uncategorized__'
    let total = 0
    let completed = 0

    for (const task of tasks ?? []) {
      total += 1
      const isCompleted = completedTaskIds.has(task.id)
      if (isCompleted) completed += 1

      const category = task.category_id
        ? categoriesById.get(task.category_id)
        : null

      const key = category ? category.id : uncategorizedKey
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: uncategorizedKey,
          title: 'Без категории',
          icon: '•',
          sort_order: 9999,
          tasks: [],
        })
      }

      grouped.get(key)!.tasks.push({
        id: task.id,
        title: task.title,
        type: task.type as 'once' | 'daily',
        task_date: task.task_date,
        completed: isCompleted,
      })
    }

    return json({
      date,
      completed,
      total,
      categories: [...grouped.values()]
        .filter((category) => category.tasks.length > 0)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ sort_order: _sortOrder, ...category }) => category),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка загрузки задач'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})