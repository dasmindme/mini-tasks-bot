export default function ProgressBar({ completed, total }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Прогресс выполнения"
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  )
}