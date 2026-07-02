// src/api/orders.js
import { apiRequest, RAZORPAY_KEY_ID } from './client.js'

export async function checkout(shipping) {
  // shipping: { shipping_name, shipping_phone, shipping_address }
  return apiRequest('/api/orders/checkout', { method: 'POST', body: shipping })
}

export async function verifyPayment(payload) {
  // payload: { internal_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
  return apiRequest('/api/orders/verify-payment', { method: 'POST', body: payload })
}

export async function getHistory() {
  return apiRequest('/api/orders/history')
}

export async function getOrder(id) {
  return apiRequest(`/api/orders/${id}`)
}

export async function trackOrder(id) {
  return apiRequest(`/api/orders/${id}/track`)
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'))
    document.body.appendChild(script)
  })
}

/**
 * Runs the full checkout flow: creates a backend order + Razorpay order,
 * opens the Razorpay Checkout modal, and verifies payment on success.
 *
 * @param {{shipping_name:string, shipping_phone:string, shipping_address:string}} shipping
 * @param {{name:string, email:string}} user
 * @param {(order) => void} onSuccess called with the final verified order
 * @param {(error) => void} onError
 * @param {() => void} [onDismiss] called if the user closes the Razorpay modal
 */
export async function startRazorpayCheckout(shipping, user, onSuccess, onError, onDismiss) {
  try {
    const rpOrder = await checkout(shipping)
    await loadRazorpayScript()

    const options = {
      key: rpOrder.razorpay_key_id || RAZORPAY_KEY_ID,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      name: 'FORGE',
      description: `Order ${rpOrder.order_number}`,
      order_id: rpOrder.razorpay_order_id,
      prefill: {
        name: user?.name || shipping.shipping_name,
        email: user?.email || '',
        contact: shipping.shipping_phone,
      },
      theme: { color: '#111111' },
      modal: {
        ondismiss: () => onDismiss && onDismiss(),
      },
      handler: async (response) => {
        try {
          const order = await verifyPayment({
            internal_order_id: rpOrder.internal_order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          onSuccess(order)
        } catch (err) {
          onError(err)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (resp) => onError(new Error(resp.error?.description || 'Payment failed')))
    rzp.open()
  } catch (err) {
    onError(err)
  }
}
