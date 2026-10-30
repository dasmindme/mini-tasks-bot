import { authenticate } from '../_shared/auth.ts'
import { error, handleOptions, json, readJson } from '../_shared/http.ts'

interface Body {
  initData?: string
  action?: 'get' | 'create' | 'update' | 'delete'
  categoryId?: string
  title?: string
  icon?: string
  sortOrder?: number
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

    if (body.action === 'get') {
      const { data: categories, error: listError } = await supabase
        .from('categories')
        .select('id, title, icon, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (listError) throw listError
      return json({ categories: categories ?? [] })
    }

    if (body.action === 'create') {
      const title = (body.title ?? '').trim()
      if (!title) return error('Введите название категории')
      if (title.length > 60) return error('Название слишком длинное')

      const { data: category, error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          title,
          icon: (body.icon ?? '♡').trim() || '♡',
          sort_order: Number.isFinite(body.sortOrder)
            ? Number(body.sortOrder)
            : 0,
        })
        .select('id, title, icon, sort_order')
        .single()

      if (insertError) throw insertError
      return json({ category }, 201)
    }

    if (!body.categoryId) return error('Не указана категория')

    const { data: existing, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', body.categoryId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) throw existingError
    if (!existing) return error('Категория не найдена', 404)

    if (body.action === 'update') {
      const title = (body.title ?? '').trim()
      if (!title) return error('Введите название категории')
      if (title.length > 60) return error('Название слишком длинное')

      const { data: category, error: updateError } = await supabase
        .from('categories')
        .update({
          title,
          icon: (body.icon ?? '♡').trim() || '♡',
          sort_order: Number.isFinite(body.sortOrder)
            ? Number(body.sortOrder)
            : 0,
        })
        .eq('id', body.categoryId)
        .eq('user_id', user.id)
        .select('id, title, icon, sort_order')
        .single()

      if (updateError) throw updateError
      return json({ category })
    }

    if (body.action === 'delete') {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', body.categoryId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return json({ ok: true })
    }

    return error('Неизвестное действие')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка категорий'
    return error(message, /initData|подпис|Telegram/i.test(message) ? 401 : 400)
  }
})