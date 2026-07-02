import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext.jsx'
import { formatINR } from '../data/products.js'
import { startRazorpayCheckout } from '../api/orders.js'
import './GaragePage.css'

export default function GaragePage(){
  const { isAuthed, user, garage, garageLoading, garageTotal, updateQty, removeFromGarage, clearGarage, logout } = useStore()
  const navigate = useNavigate()

  const [showShippingForm, setShowShippingForm] = useState(false)
  const [shippingName, setShippingName] = useState(user?.name || '')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [placing, setPlacing] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  if (!isAuthed) {
    return (
      <main className="garage garage--gate container">
        <span className="eyebrow">Garage</span>
        <h1 className="garage-title">Sign in to open your Garage</h1>
        <p className="garage-gate-copy">
          Your Garage saves every build, part and fitment to your account so
          nothing gets lost between sessions.
        </p>
        <Link
          to="/login"
          state={{ from: '/garage' }}
          className="btn btn-solid"
        >
          Sign In
        </Link>
      </main>
    )
  }

  const shipping = garage.length ? 0 : 0
  const total = garageTotal + shipping

  const handleCheckoutClick = () => {
    setCheckoutError('')
    setShowShippingForm(true)
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setCheckoutError('Please fill in your name, phone and delivery address.')
      return
    }
    setCheckoutError('')
    setPlacing(true)

    await startRazorpayCheckout(
      { shipping_name: shippingName.trim(), shipping_phone: shippingPhone.trim(), shipping_address: shippingAddress.trim() },
      user,
      (order) => {
        setPlacing(false)
        setShowShippingForm(false)
        navigate('/orders', { state: { justPlaced: order.order_number } })
      },
      (err) => {
        setPlacing(false)
        setCheckoutError(err.message || 'Payment could not be completed. Please try again.')
      },
      () => {
        setPlacing(false)
      }
    )
  }

  return (
    <main className="garage container">
      <div className="garage-head">
        <div>
          <span className="eyebrow">{user.name}&apos;s Garage</span>
          <h1 className="garage-title">Your Build</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/orders" className="garage-signout">My Orders</Link>
          <button className="garage-signout" onClick={logout}>Sign out</button>
        </div>
      </div>

      {garageLoading ? (
        <p style={{ padding: '2rem 0' }}>Loading your Garage…</p>
      ) : garage.length === 0 ? (
        <div className="garage-empty">
          <p>Your Garage is empty. Add parts to start a build.</p>
          <Link to="/shop" className="btn btn-solid">Shop Parts</Link>
        </div>
      ) : (
        <div className="garage-grid">
          <ul className="garage-list">
            {garage.map((item) => (
              <li className="garage-item brackets" key={`${item.id}-${item.variant}`}>
                <span className="bk-tr" /><span className="bk-bl" />
                <Link to={`/product/${item.id}`} className="garage-thumb">
                  <img src={item.img} alt={item.name} />
                </Link>
                <div className="garage-item-info">
                  <Link to={`/product/${item.id}`} className="garage-item-name">{item.name}</Link>
                  {item.variant && item.variant !== 'default' && (
                    <span className="garage-item-variant">{item.variant}</span>
                  )}
                </div>
                <div className="garage-qty">
                  <button onClick={() => updateQty(item.id, item.variant, item.qty - 1)} aria-label="Decrease quantity">−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.variant, item.qty + 1)} aria-label="Increase quantity">+</button>
                </div>
                <span className="garage-item-price">{formatINR(item.price * item.qty)}</span>
                <button
                  className="garage-remove"
                  onClick={() => removeFromGarage(item.id, item.variant)}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <aside className="garage-summary brackets">
            <span className="bk-tr" /><span className="bk-bl" />
            <h2>Summary</h2>
            <div className="garage-line"><span>Subtotal</span><span>{formatINR(garageTotal)}</span></div>
            <div className="garage-line"><span>Shipping</span><span>Free</span></div>
            <div className="garage-line garage-line--total"><span>Total</span><span>{formatINR(total)}</span></div>

            {!showShippingForm ? (
              <button className="btn btn-solid garage-checkout" onClick={handleCheckoutClick}>
                Checkout
              </button>
            ) : (
              <form className="garage-checkout-form" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.75rem' }}>
                <input
                  type="text" placeholder="Full name" value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  style={{ padding: '.6rem .8rem' }}
                />
                <input
                  type="tel" placeholder="Phone number" value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  style={{ padding: '.6rem .8rem' }}
                />
                <textarea
                  placeholder="Delivery address" value={shippingAddress} rows={3}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={{ padding: '.6rem .8rem', resize: 'vertical' }}
                />
                {checkoutError && <p style={{ color: '#e05252', fontSize: '.85em' }}>{checkoutError}</p>}
                <button className="btn btn-solid garage-checkout" type="submit" disabled={placing}>
                  {placing ? 'Opening payment…' : `Pay ${formatINR(total)} with Razorpay`}
                </button>
              </form>
            )}

            <button className="garage-clear" onClick={clearGarage}>Clear Garage</button>
          </aside>
        </div>
      )}
    </main>
  )
}
