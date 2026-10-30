import { callFunction } from './client'

export function authTelegram() {
  return callFunction('auth-telegram')
}

export function getToday(date) {
  return callFunction('get-today', { date })
}

export function createTask(payload) {
  return callFunction('create-task', payload)
}

export function updateTask(payload) {
  return callFunction('update-task', payload)
}

export function deleteTask(taskId) {
  return callFunction('delete-task', { taskId })
}

export function completeTask(taskId, date) {
  return callFunction('complete-task', { taskId, date })
}

export function uncompleteTask(taskId, date) {
  return callFunction('uncomplete-task', { taskId, date })
}