import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'
import { formatINR } from '../data/products.js'
import { getOrder } from '../api/orders.js'
import './GaragePage.css'

const STEPS = ['order_placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const STEP_LABELS = {
  order_placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { isAuthed } = useStore()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthed) { setLoading(false); return }
    getOrder(id)
      .then(setOrder)
      .catch(() => setError('Could not find this order.'))
      .finally(() => setLoading(false))
  }, [id, isAuthed])

  if (!isAuthed) {
    return (
      <main className="garage garage--gate container">
        <span className="eyebrow">Order</span>
        <h1 className="garage-title">Sign in to view this order</h1>
        <Link to="/login" state={{ from: `/orders/${id}` }} className="btn btn-solid">Sign In</Link>
      </main>
    )
  }

  if (loading) return <main className="garage container"><p style={{ padding: '2rem 0' }}>Loading order…</p></main>
  if (error || !order) return <main className="garage container"><p className="garage-empty">{error || 'Order not found.'}</p></main>

  const currentIdx = STEPS.indexOf(order.delivery_status)

  return (
    <main className="garage container">
      <div className="garage-head">
        <div>
          <span className="eyebrow">Order {order.order_number}</span>
          <h1 className="garage-title">Track Delivery</h1>
        </div>
        <Link to="/orders" className="garage-signout">All Orders</Link>
      </div>

      {/* Amazon-style progress tracker */}
      <div className="garage-summary brackets" style={{ marginBottom: '2rem' }}>
        <span className="bk-tr" /><span className="bk-bl" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap' }}>
          {STEPS.map((step, i) => (
            <div key={step} style={{ flex: 1, minWidth: '110px', textAlign: 'center', opacity: i <= currentIdx ? 1 : 0.35 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', margin: '0 auto .5rem',
                background: i <= currentIdx ? '#3cb464' : 'rgba(255,255,255,.2)',
              }} />
              <span style={{ fontSize: '.75em' }}>{STEP_LABELS[step]}</span>
            </div>
          ))}
        </div>
        {order.estimated_delivery && order.delivery_status !== 'delivered' && (
          <p style={{ marginTop: '1rem', fontSize: '.85em', opacity: 0.8 }}>
            Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="garage-grid">
        <ul className="garage-list">
          {order.items.map((it) => (
            <li className="garage-item brackets" key={`${it.product_id}-${it.variant}`} style={{ gridTemplateColumns: '1fr auto' }}>
              <span className="bk-tr" /><span className="bk-bl" />
              {it.img && (
                <Link to={`/product/${it.product_id}`} className="garage-thumb">
                  <img src={it.img} alt={it.name} />
                </Link>
              )}
              <div className="garage-item-info">
                <Link to={`/product/${it.product_id}`} className="garage-item-name">{it.name}</Link>
                <span className="garage-item-variant">Qty {it.qty}</span>
              </div>
              <span className="garage-item-price">{formatINR(it.unit_price * it.qty)}</span>
            </li>
          ))}
        </ul>

        <aside className="garage-summary brackets">
          <span className="bk-tr" /><span className="bk-bl" />
          <h2>Order Summary</h2>
          <div className="garage-line"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="garage-line"><span>Shipping</span><span>{order.shipping_fee ? formatINR(order.shipping_fee) : 'Free'}</span></div>
          <div className="garage-line garage-line--total"><span>Total</span><span>{formatINR(order.total)}</span></div>
          <h2 style={{ marginTop: '1.5rem' }}>Deliver To</h2>
          <p style={{ fontSize: '.9em', opacity: 0.85 }}>
            {order.shipping_name}<br />{order.shipping_phone}<br />{order.shipping_address}
          </p>

          {order.tracking_events?.length > 0 && (
            <>
              <h2 style={{ marginTop: '1.5rem' }}>Tracking History</h2>
              <ul style={{ fontSize: '.85em', opacity: 0.85, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {order.tracking_events.map((e, i) => (
                  <li key={i}>
                    <strong>{STEP_LABELS[e.status] || e.status}</strong> — {e.message}
                    {e.location && ` (${e.location})`}
                    <br />
                    <span style={{ opacity: 0.6 }}>{new Date(e.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </main>
  )
}
