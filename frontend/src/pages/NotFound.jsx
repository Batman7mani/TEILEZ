import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
      <span className="eyebrow">404</span>
      <h1
        style={{
          fontFamily: 'var(--f-display)',
          fontWeight: 800,
          textTransform: 'uppercase',
          fontSize: 'clamp(2rem,5vw,3.5rem)',
          margin: '10px 0 24px',
          color: 'var(--ink-900)',
        }}
      >
        Part Not Found
      </h1>
      <Link to="/" className="btn btn-solid">Back to Home</Link>
    </main>
  )
}
