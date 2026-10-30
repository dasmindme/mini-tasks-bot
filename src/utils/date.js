export function todayISO(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateRu(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`)
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatShortDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}