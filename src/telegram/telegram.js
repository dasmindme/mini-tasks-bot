let webApp = null
let initData = ''

export function initTelegram() {
  webApp = window.Telegram?.WebApp ?? null

  if (!webApp) {
    return { available: false, user: null }
  }

  initData = webApp.initData || ''

  try {
    webApp.ready()
    webApp.expand()
    webApp.setHeaderColor?.('#FFF8DC')
    webApp.setBackgroundColor?.('#FFF8DC')
  } catch {
    // Older Telegram clients may not support every method.
  }

  return {
    available: Boolean(initData),
    user: webApp.initDataUnsafe?.user ?? null,
  }
}

export function getInitData() {
  return initData
}

export function getTelegramUser() {
  return webApp?.initDataUnsafe?.user ?? null
}

export function hapticLight() {
  try {
    webApp?.HapticFeedback?.impactOccurred('light')
  } catch {
    // Haptics are optional.
  }
}

export function showAlert(message) {
  if (webApp?.showAlert) {
    webApp.showAlert(message)
  } else {
    window.alert(message)
  }
}