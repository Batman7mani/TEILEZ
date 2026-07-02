// src/api/client.js
// Thin fetch wrapper for the FORGE backend (FastAPI).
// Base URL comes from VITE_API_BASE_URL (see .env.example), defaults to localhost:8000.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T89lEU1UpQlopw'

const TOKEN_KEY = 'forge_token_v1'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, { method = 'GET', body, auth = true, params } = {}) {
  let url = `${API_BASE}${path}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (!res.ok) {
    const message = (data && data.detail) || res.statusText || 'Request failed'
    throw new ApiError(typeof message === 'string' ? message : JSON.stringify(message), res.status, data)
  }

  return data
}
