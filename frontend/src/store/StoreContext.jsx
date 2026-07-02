// src/store/StoreContext.jsx
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import * as authApi from '../api/auth.js'
import * as cartApi from '../api/cart.js'
import { getToken, setToken as persistToken } from '../api/client.js'

const StoreContext = createContext(null)
const USER_KEY = 'forge_user_v1'

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // garage = the shopping cart, now backed by the FastAPI /api/cart endpoints.
  // Shape kept close to the original local-only version: [{id, name, cat, price, img, variant, qty}]
  const [garage, setGarage] = useState([])
  const [garageLoading, setGarageLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }, [user])

  const refreshCart = useCallback(async () => {
    if (!getToken()) { setGarage([]); return }
    setGarageLoading(true)
    try {
      const cart = await cartApi.getCart()
      setGarage(cart.items.map((it) => ({
        id: it.product_id,
        name: it.name,
        img: it.img,
        variant: it.variant,
        qty: it.qty,
        price: it.unit_price,
      })))
    } catch {
      setGarage([])
    } finally {
      setGarageLoading(false)
    }
  }, [])

  // On first load, if a token already exists (returning session), fetch profile + cart.
  useEffect(() => {
    const token = getToken()
    if (!token) return
    authApi.fetchMe()
      .then((u) => setUser(u))
      .catch(() => { persistToken(null); setUser(null) })
    refreshCart()
  }, [refreshCart])

  const login = useCallback(async (email, password) => {
    const u = await authApi.login(email, password)
    setUser(u)
    await refreshCart()
    return u
  }, [refreshCart])

  const signup = useCallback(async (name, email, password) => {
    const u = await authApi.signup(name, email, password)
    setUser(u)
    await refreshCart()
    return u
  }, [refreshCart])

  const loginWithGoogle = useCallback(async (idToken) => {
    const u = await authApi.loginWithGoogle(idToken)
    setUser(u)
    await refreshCart()
    return u
  }, [refreshCart])

  const logout = useCallback(() => {
    persistToken(null)
    setUser(null)
    setGarage([])
  }, [])

  const addToGarage = useCallback(async (item) => {
    await cartApi.addToCart(item.id, item.qty || 1, item.variant || 'default')
    await refreshCart()
  }, [refreshCart])

  const updateQty = useCallback(async (id, variant, qty) => {
    await cartApi.updateCartItem(id, qty, variant || 'default')
    await refreshCart()
  }, [refreshCart])

  const removeFromGarage = useCallback(async (id, variant) => {
    await cartApi.removeCartItem(id, variant || 'default')
    await refreshCart()
  }, [refreshCart])

  const clearGarage = useCallback(async () => {
    await cartApi.clearCart()
    setGarage([])
  }, [])

  const garageTotal = useMemo(
    () => garage.reduce((sum, item) => sum + item.price * item.qty, 0),
    [garage]
  )
  const garageCount = useMemo(
    () => garage.reduce((sum, item) => sum + item.qty, 0),
    [garage]
  )

  const value = {
    isAuthed: !!user,
    user,
    login,
    signup,
    loginWithGoogle,
    logout,
    garage,
    garageLoading,
    garageTotal,
    garageCount,
    addToGarage,
    updateQty,
    removeFromGarage,
    clearGarage,
    refreshCart,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
