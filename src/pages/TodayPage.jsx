import { useEffect, useState } from 'react'
import { completeTask, getToday, uncompleteTask } from '../api/tasks'
import { getCategories } from '../api/categories'
import CategoryCard from '../components/CategoryCard'
import ProgressBar from '../components/ProgressBar'
import TaskFormModal from '../components/TaskFormModal'
import { hapticLight } from '../telegram/telegram'
import { formatDateRu, todayISO } from '../utils/date'

function applyCompletion(data, taskId, completed) {
  let delta = 0
  const categories = data.categories.map((category) => ({
    ...category,
    tasks: category.tasks.map((task) => {
      if (task.id !== taskId || task.completed === completed) return task
      delta = completed ? 1 : -1
      return { ...task, completed }
    }),
  }))

  return {
    ...data,
    completed: Math.max(0, Math.min(data.total, data.completed + delta)),
    categories,
  }
}

export default function TodayPage() {
  const [date] = useState(() => todayISO())
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState('')
  const [pendingIds, setPendingIds] = useState(() => new Set())
  const [formTask, setFormTask] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [today, categoriesResult] = await Promise.all([
        getToday(date),
        getCategories(),
      ])
      setData(today)
      setCategories(categoriesResult.categories ?? [])
    } catch (err) {
      setError(err.message || 'Не удалось загрузить задачи')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!banner) return undefined
    const timer = setTimeout(() => setBanner(''), 4000)
    return () => clearTimeout(timer)
  }, [banner])

  async function handleToggle(task) {
    if (pendingIds.has(task.id) || !data) return

    const nextCompleted = !task.completed
    setPendingIds((previous) => new Set(previous).add(task.id))
    setData((previous) =>
      previous ? applyCompletion(previous, task.id, nextCompleted) : previous,
    )

    try {
      if (nextCompleted) {
        await completeTask(task.id, date)
      } else {
        await uncompleteTask(task.id, date)
      }
      hapticLight()
    } catch (err) {
      setData((previous) =>
        previous ? applyCompletion(previous, task.id, !nextCompleted) : previous,
      )
      setBanner(err.message || 'Не удалось обновить задачу')
    } finally {
      setPendingIds((previous) => {
        const next = new Set(previous)
        next.delete(task.id)
        return next
      })
    }
  }

  function openEdit(task, category) {
    setFormTask({
      ...task,
      categoryId:
        category.id === '__uncategorized__' ? '' : category.id,
    })
    setFormOpen(true)
  }

  function openCreate() {
    setFormTask(null)
    setFormOpen(true)
  }

  function handleSaved() {
    load()
  }

  const completed = data?.completed ?? 0
  const total = data?.total ?? 0
  const allDone = total > 0 && completed === total

  return (
    <>
      <p className="date-line">{formatDateRu(date)}</p>

      <section className="hero-card">
        <div className="hero-card__top">
          <div>
            <span className="eyebrow">Ежедневный чек-лист</span>
            <h1>Планы на сегодня</h1>
          </div>
          <span className="hero-card__flower" aria-hidden="true">
            ✿
          </span>
        </div>

        <div className="hero-card__progress">
          <span>
            {completed} из {total} выполнено
          </span>
          <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
        </div>
        <ProgressBar completed={completed} total={total} />
        <p className="hero-card__hint">
          {allDone
            ? 'Всё готово. Можно выдохнуть и порадовать себя ♡'
            : total === 0
              ? 'Маленькие шаги складываются в большие перемены.'
              : 'Не спешите. Отмечайте по одному делу за раз.'}
        </p>
      </section>

      {loading && (
        <div className="state-card">
          <span className="state-card__icon">✿</span>
          <p>Составляем список на сегодня…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-card">
          <span className="state-card__icon">◌</span>
          <p>{error}</p>
          <button type="button" className="button button--ghost" onClick={load}>
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="state-card">
          <span className="state-card__icon">✧</span>
          <h2>На сегодня пусто</h2>
          <p>Добавьте первое маленькое дело — с него всё начнётся.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={openCreate}
          >
            Добавить задачу
          </button>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="category-list">
          {data.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onToggleTask={handleToggle}
              onEditTask={openEdit}
              pendingIds={pendingIds}
            />
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <button
          type="button"
          className="fab"
          onClick={openCreate}
          aria-label="Добавить задачу"
        >
          +
        </button>
      )}

      {banner && <div className="toast">{banner}</div>}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        categories={categories}
        initialTask={formTask?.id ? formTask : null}
        defaultDate={date}
      />
    </>
  )
}