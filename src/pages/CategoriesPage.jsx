import { useEffect, useState } from 'react'
import { getCategories } from '../api/categories'
import CategoryFormModal from '../components/CategoryFormModal'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formCategory, setFormCategory] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await getCategories()
      setCategories(result.categories ?? [])
    } catch (err) {
      setError(err.message || 'Не удалось загрузить категории')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setFormCategory(null)
    setFormOpen(true)
  }

  function openEdit(category) {
    setFormCategory(category)
    setFormOpen(true)
  }

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Порядок в делах</span>
          <h1>Категории</h1>
        </div>
        <button
          type="button"
          className="round-button"
          onClick={openCreate}
          aria-label="Добавить категорию"
        >
          +
        </button>
      </header>

      {loading && (
        <div className="state-card">
          <span className="state-card__icon">✿</span>
          <p>Собираем ваши категории…</p>
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

      {!loading && !error && categories.length === 0 && (
        <div className="state-card">
          <span className="state-card__icon">✧</span>
          <h2>Пока нет категорий</h2>
          <p>Создайте категорию, чтобы группировать задачи.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={openCreate}
          >
            Создать категорию
          </button>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="category-list">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className="category-manage"
              onClick={() => openEdit(category)}
            >
              <span className="category-manage__icon" aria-hidden="true">
                {category.icon}
              </span>
              <span className="category-manage__body">
                <span className="category-manage__title">{category.title}</span>
                <span className="category-manage__meta">
                  Порядок сортировки: {category.sort_order}
                </span>
              </span>
              <span className="category-manage__arrow" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <button
          type="button"
          className="fab"
          onClick={openCreate}
          aria-label="Добавить категорию"
        >
          +
        </button>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        initialCategory={formCategory}
      />
    </>
  )
}