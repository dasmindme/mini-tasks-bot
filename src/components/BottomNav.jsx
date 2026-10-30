const ITEMS = [
  { id: 'today', label: 'Сегодня', icon: '☀' },
  { id: 'categories', label: 'Категории', icon: '❀' },
  { id: 'settings', label: 'Настройки', icon: '⚙' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`bottom-nav__item ${
            active === item.id ? 'is-active' : ''
          }`}
          onClick={() => onChange(item.id)}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}