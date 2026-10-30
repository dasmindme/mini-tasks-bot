import { useEffect, useState } from 'react'
import { authTelegram } from './api/tasks'
import { hasSupabaseConfig } from './api/client'
import { initTelegram } from './telegram/telegram'
import Layout from './components/Layout'
import BottomNav from './components/BottomNav'
import TodayPage from './pages/TodayPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'

const TABS = ['today', 'categories', 'settings']

export default function App() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('today')

  useEffect(() => {
    const telegram = initTelegram()

    if (!telegram.available) {
      setStatus('error')
      setMessage('Откройте приложение через Telegram.')
      return
    }

    if (!hasSupabaseConfig()) {
      setStatus('error')
      setMessage('Приложение не настроено: отсутствуют переменные Supabase.')
      return
    }

    authTelegram()
      .then((data) => {
        setUser(data.user)
        setStatus('ready')
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'Не удалось открыть приложение.')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="splash">
        <div className="splash__flower">♡</div>
        <p>Загружаем ваши планы…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="splash splash--error">
        <div className="splash__flower">✿</div>
        <h1>Планы на сегодня</h1>
        <p>{message}</p>
        <p className="muted">
          Откройте бота в Telegram и нажмите кнопку меню с приложением.
        </p>
      </div>
    )
  }

  return (
    <Layout>
      <div className="page" key={tab}>
        {tab === 'today' && <TodayPage />}
        {tab === 'categories' && <CategoriesPage />}
        {tab === 'settings' && <SettingsPage user={user} />}
      </div>
      <BottomNav
        active={tab}
        onChange={(next) => {
          if (TABS.includes(next)) setTab(next)
        }}
      />
    </Layout>
  )
}