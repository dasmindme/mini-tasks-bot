export default function TaskRow({ task, onToggle, onEdit, pending }) {
  return (
    <article className={`task-row ${task.completed ? 'is-completed' : ''}`}>
      <button
        type="button"
        className="task-check"
        onClick={() => onToggle(task)}
        disabled={pending}
        aria-pressed={task.completed}
        aria-label={
          task.completed
            ? `Снять отметку с задачи «${task.title}»`
            : `Отметить задачу «${task.title}» выполненной`
        }
      >
        <span className="task-check__mark">✓</span>
      </button>

      <button
        type="button"
        className="task-main"
        onClick={() => onEdit(task)}
        aria-label={`Изменить задачу «${task.title}»`}
      >
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.type === 'daily' ? 'Каждый день' : 'Разовая'}
        </span>
      </button>
    </article>
  )
}