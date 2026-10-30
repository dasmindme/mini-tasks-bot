import { useEffect, useState } from 'react'
import { createTask, deleteTask, updateTask } from '../api/tasks'
import { hapticLight } from '../telegram/telegram'
import { todayISO } from '../utils/date'

export default function TaskFormModal({
  open,
  onClose,
  onSaved,
  categories,
  initialTask,
  defaultDate,
}) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState('daily')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initialTask?.title ?? '')
    setCategoryId(initialTask?.categoryId ?? '')
    setType(initialTask?.type ?? 'daily')
    setDate(initialTask?.task_date ?? defaultDate ?? todayISO())
    setSaving(false)
    setError('')
  }, [open, initialTask, defaultDate])

  if (!open) return null

  const isEditing = Boolean(initialTask?.id)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('Введите название задачи')
      return
    }
    if (type === 'once' && !date) {
      setError('Выберите дату для разовой задачи')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: cleanTitle,
      categoryId: categoryId || null,
      type,
      date: type === 'once' ? date : null,
    }

    try {
      if (isEditing) {
        await updateTask({ ...payload, taskId: initialTask.id })
      } else {
        await createTask(payload)
      }
      hapticLight()
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось сохранить задачу')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEditing) return
    const confirmed = window.confirm(
      'Удалить задачу? Она исчезнет из сегодняшнего списка.',
    )
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteTask(initialTask.id)
      hapticLight()
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось удалить задачу')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Редактирование задачи' : 'Новая задача'}
      >
        <div className="modal__handle" />
        <header className="modal__header">
          <h2>{isEditing ? 'Изменить задачу' : 'Новая задача'}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Название</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например, прочитать 10 страниц"
              maxLength={200}
              autoFocus={!isEditing}
            />
          </label>

          <label className="field">
            <span className="field__label">Категория</span>
            <select
              className="input"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.title}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span className="field__label">Тип задачи</span>
            <div className="segmented" role="group" aria-label="Тип задачи">
              <button
                type="button"
                className={type === 'daily' ? 'is-active' : ''}
                onClick={() => setType('daily')}
              >
                Каждый день
              </button>
              <button
                type="button"
                className={type === 'once' ? 'is-active' : ''}
                onClick={() => setType('once')}
              >
                Один раз
              </button>
            </div>
          </div>

          {type === 'once' && (
            <label className="field">
              <span className="field__label">Дата</span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
          )}

          {error && <p className="form__error">{error}</p>}

          <div className="form__actions">
            {isEditing ? (
              <button
                type="button"
                className="button button--ghost button--danger"
                onClick={handleDelete}
                disabled={saving}
              >
                Удалить
              </button>
            ) : (
              <span />
            )}
            <div className="form__actions-right">
              <button
                type="button"
                className="button button--ghost"
                onClick={onClose}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}