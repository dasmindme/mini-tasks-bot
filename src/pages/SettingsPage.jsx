const APP_VERSION = '0.1.0'

export default function SettingsPage({ user }) {
  const displayName =
    user?.first_name || user?.username || 'Друг'

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">Тихое место</span>
          <h1>Настройки</h1>
        </div>
      </header>

      <section className="profile-card">
        <div className="profile-card__avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="profile-card__name">{displayName}</p>
          {user?.username && (
            <p className="profile-card__meta">@{user.username}</p>
          )}
          <p className="profile-card__meta">
            Telegram ID: {user?.telegram_id ?? '—'}
          </p>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card__row">
          <span>Версия приложения</span>
          <span className="muted">{APP_VERSION}</span>
        </div>
        <div className="settings-card__row">
          <span>Часовой пояс</span>
          <span className="muted">{user?.timezone || 'Europe/Moscow'}</span>
        </div>
      </section>

      <section className="settings-card settings-card--placeholder">
        <div className="settings-card__heading">
          <span className="settings-card__icon" aria-hidden="true">
            ◌
          </span>
          <div>
            <h2>Напоминания</h2>
            <p className="muted">
              Скоро бот сможет мягко напоминать о планах в удобное время.
            </p>
          </div>
        </div>
        <span className="badge">в разработке</span>
      </section>

      <p className="settings-footer">
        Сделано с заботой о ваших маленьких шагах ♡
      </p>
    </>
  )
}