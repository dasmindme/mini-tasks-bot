import { callFunction } from './client'

export function getCategories() {
  return callFunction('categories', { action: 'get' })
}

export function createCategory(payload) {
  return callFunction('categories', { action: 'create', ...payload })
}

export function updateCategory(payload) {
  return callFunction('categories', { action: 'update', ...payload })
}

export function deleteCategory(categoryId) {
  return callFunction('categories', { action: 'delete', categoryId })
}