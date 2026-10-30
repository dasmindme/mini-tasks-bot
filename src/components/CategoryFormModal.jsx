import { useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../api/categories'
import { hapticLight } from '../telegram/telegram'

export default function CategoryFormModal({
  open,
  onClose,
  onSaved,
  initialCategory,
}) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('♡')
  const [sortOrder, setSortOrder] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(initialCategory?.title ?? '')
    setIcon(initialCategory?.icon ?? '♡')
    setSortOrder(initialCategory?.sort_order ?? 0)
    setSaving(false)
    setError('')
  }, [open, initialCategory])

  if (!open) return null

  const isEditing = Boolean(initialCategory?.id)

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('Введите название категории')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: cleanTitle,
      icon: icon.trim() || '♡',
      sortOrder: Number(sortOrder) || 0,
    }

    try {
      if (isEditing) {
        await updateCategory({ ...payload, categoryId: initialCategory.id })
      } else {
        await createCategory(payload)
      }
      hapticLight()
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось сохранить категорию')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!isEditing) return
    const confirmed = window.confirm(
      'Удалить категорию? Задачи из неё останутся и попадут в «Без категории».',
    )
    if (!confirmed) return

    setSaving(true)
    setError('')
    try {
      await deleteCategory(initialCategory.id)
      hapticLight()
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось удалить категорию')
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
        aria-label={isEditing ? 'Редактирование категории' : 'Новая категория'}
      >
        <div className="modal__handle" />
        <header className="modal__header">
          <h2>{isEditing ? 'Изменить категорию' : 'Новая категория'}</h2>
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
              placeholder="Например, Красота"
              maxLength={60}
              autoFocus={!isEditing}
            />
          </label>

          <div className="form__row">
            <label className="field field--icon">
              <span className="field__label">Иконка</span>
              <input
                className="input input--icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                maxLength={8}
                aria-label="Эмодзи категории"
              />
            </label>

            <label className="field">
              <span className="field__label">Порядок</span>
              <input
                className="input"
                type="number"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </label>
          </div>

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