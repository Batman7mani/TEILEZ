// src/api/auth.js
import { apiRequest, setToken } from './client.js'

export async function signup(name, email, password) {
  const data = await apiRequest('/api/auth/signup', {
    method: 'POST', auth: false,
    body: { name, email, password },
  })
  setToken(data.access_token)
  return data.user
}

export async function login(email, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST', auth: false,
    body: { email, password },
  })
  setToken(data.access_token)
  return data.user
}

export async function loginWithGoogle(idToken) {
  const data = await apiRequest('/api/auth/google', {
    method: 'POST', auth: false,
    body: { id_token: idToken },
  })
  setToken(data.access_token)
  return data.user
}

export async function fetchMe() {
  return apiRequest('/api/auth/me')
}

export async function updateMe(payload) {
  return apiRequest('/api/auth/me', { method: 'PUT', body: payload })
}

export function logoutLocal() {
  setToken(null)
}
