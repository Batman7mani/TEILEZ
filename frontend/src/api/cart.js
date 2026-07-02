// src/api/cart.js
import { apiRequest } from './client.js'

export async function getCart() {
  return apiRequest('/api/cart')
}

export async function addToCart(productId, qty = 1, variant = 'default') {
  return apiRequest('/api/cart', {
    method: 'POST',
    body: { product_id: productId, qty, variant },
  })
}

export async function updateCartItem(productId, qty, variant = 'default') {
  return apiRequest(`/api/cart/${productId}`, {
    method: 'PUT',
    params: { variant },
    body: { qty },
  })
}

export async function removeCartItem(productId, variant = 'default') {
  return apiRequest(`/api/cart/${productId}`, { method: 'DELETE', params: { variant } })
}

export async function clearCart() {
  return apiRequest('/api/cart', { method: 'DELETE' })
}
