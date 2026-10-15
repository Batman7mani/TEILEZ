import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'
import './LoginPage.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function LoginPage(){
  const { login, signup, loginWithGoogle } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/garage'

  const [mode, setMode] = useState('signin') // signin | register
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    if (mode === 'register' && !name.trim()) {
      setError('Tell us what to call you.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await signup(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Google Identity Services (renders its own button into #google-signin-btn)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const scriptId = 'google-identity-script'
    function renderButton() {
      if (!window.google || !document.getElementById('google-signin-btn')) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          setError('')
          try {
            await loginWithGoogle(resp.credential)
            navigate(redirectTo, { replace: true })
          } catch (err) {
            setError(err.message || 'Google sign-in failed.')
          }
        },
      })
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: 320 }
      )
    }
    if (document.getElementById(scriptId)) { renderButton(); return }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = renderButton
    document.body.appendChild(script)
  }, [loginWithGoogle, navigate, redirectTo])

  return (
    <main className="login">
      <div className="login-visual">
        <video
          className="login-video"
          src={import.meta.env.BASE_URL + "assets/loader-bg.mp4"}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="login-visual-scrim" />
        <div className="login-visual-copy">
          <Link to="/" className="login-brand">FORGE</Link>
          <h2>BUILT<br/>NOT BOUGHT.</h2>
          <p>
            Sign in to open your Garage — save builds, track fitments and
            pick up exactly where you left off.
          </p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <span className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create account'}</span>
          <h1 className="login-title">
            {mode === 'signin' ? 'Sign in to your Garage' : 'Join the FORGE'}
          </h1>

          <form className="login-form" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <label className="login-field">
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rohan Mehta"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@garage.in"
                autoComplete="email"
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn btn-solid login-submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <div id="google-signin-btn" />
            </div>
          )}

          <p className="login-switch">
            {mode === 'signin' ? "Don't have an account?" : 'Already with us?'}{' '}
            <button
              type="button"
              className="login-link"
              onClick={() => { setError(''); setMode(mode === 'signin' ? 'register' : 'signin') }}
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <Link to="/" className="login-back">← Back to store</Link>
        </div>
      </div>
    </main>
  )
}
