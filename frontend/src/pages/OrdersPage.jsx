import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'
import { formatINR } from '../data/products.js'
import { getHistory } from '../api/orders.js'
import './GaragePage.css'

export default function OrdersPage() {
  const { isAuthed } = useStore()
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthed) { setLoading(false); return }
    getHistory()
      .then(setOrders)
      .catch(() => setError('Could not load your orders right now.'))
      .finally(() => setLoading(false))
  }, [isAuthed])

  if (!isAuthed) {
    return (
      <main className="garage garage--gate container">
        <span className="eyebrow">Orders</span>
        <h1 className="garage-title">Sign in to see your orders</h1>
        <Link to="/login" state={{ from: '/orders' }} className="btn btn-solid">Sign In</Link>
      </main>
    )
  }

  return (
    <main className="garage container">
      <div className="garage-head">
        <div>
          <span className="eyebrow">Purchase History</span>
          <h1 className="garage-title">My Orders</h1>
        </div>
        <Link to="/garage" className="garage-signout">Back to Garage</Link>
      </div>

      {location.state?.justPlaced && (
        <p style={{ padding: '.8rem 1rem', background: 'rgba(60,180,100,.12)', border: '1px solid rgba(60,180,100,.4)', marginBottom: '1.5rem' }}>
          Order <strong>{location.state.justPlaced}</strong> placed successfully — payment confirmed.
        </p>
      )}

      {loading ? (
        <p style={{ padding: '2rem 0' }}>Loading your orders…</p>
      ) : error ? (
        <p className="garage-empty">{error}</p>
      ) : orders.length === 0 ? (
        <div className="garage-empty">
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn btn-solid">Shop Parts</Link>
        </div>
      ) : (
        <ul className="garage-list">
          {orders.map((o) => (
            <li className="garage-item brackets" key={o.id} style={{ gridTemplateColumns: '1fr auto auto' }}>
              <span className="bk-tr" /><span className="bk-bl" />
              <div className="garage-item-info">
                <Link to={`/orders/${o.id}`} className="garage-item-name">{o.order_number}</Link>
                <span className="garage-item-variant">{o.item_count} item(s) · {new Date(o.created_at).toLocaleDateString()}</span>
                <span className="garage-item-cat" style={{ textTransform: 'capitalize' }}>{o.delivery_status.replace(/_/g, ' ')}</span>
              </div>
              <span className="garage-item-price">{formatINR(o.total)}</span>
              <Link to={`/orders/${o.id}`} className="btn btn-ghost" style={{ padding: '.5rem 1rem' }}>Track</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
