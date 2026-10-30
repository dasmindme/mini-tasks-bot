import TaskRow from './TaskRow'

export default function CategoryCard({
  category,
  onToggleTask,
  onEditTask,
  pendingIds,
}) {
  const count = category.tasks.length
  const done = category.tasks.filter((task) => task.completed).length

  return (
    <section className="category-card">
      <header className="category-card__header">
        <span className="category-card__icon" aria-hidden="true">
          {category.icon}
        </span>
        <h2 className="category-card__title">{category.title}</h2>
        <span className="category-card__count">
          {done}/{count}
        </span>
      </header>

      <div className="task-list">
        {category.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onEdit={(item) => onEditTask(item, category)}
            pending={pendingIds.has(task.id)}
          />
        ))}
      </div>
    </section>
  )
}