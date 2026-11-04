// Razorpay Standard Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
// Card details are entered in Razorpay's own window; the browser only relays the signed result to
// ShowTime, which verifies it with Razorpay before confirming anything.

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let loading = null

/** Loads checkout.js once, on first use. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = CHECKOUT_SRC
      script.async = true
      script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay did not load.')))
      script.onerror = () => {
        loading = null
        script.remove()
        reject(new Error('Could not reach the payment provider. Check your connection and try again.'))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}

/**
 * Opens checkout for a server-created payment session. Resolves with
 * { status: 'success', result: { providerOrderId, providerPaymentId, signature } } or
 * { status: 'dismissed', failure } when the customer closes the window. A failed attempt keeps the
 * window open so the customer can try another method; its message is reported on dismiss.
 */
export async function openRazorpayCheckout(session) {
  const Razorpay = await loadRazorpay()
  return new Promise((resolve) => {
    let failure = null
    const checkout = new Razorpay({
      key: session.keyId,
      order_id: session.providerOrderId,
      amount: session.amountMinor,
      currency: session.currency,
      name: 'ShowTime',
      description: session.description,
      // Razorpay asks for a mobile number; pre-fill it when the customer's profile has one.
      prefill: { name: session.customerName, email: session.customerEmail, ...(session.customerPhone ? { contact: session.customerPhone } : {}) },
      notes: { booking: session.bookingReference },
      theme: { color: '#FF5A5F' },
      handler: (response) =>
        resolve({
          status: 'success',
          result: {
            providerOrderId: response.razorpay_order_id,
            providerPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          },
        }),
      modal: { ondismiss: () => resolve({ status: 'dismissed', failure }) },
    })
    checkout.on('payment.failed', (response) => {
      failure = response?.error?.description || 'The payment was declined.'
    })
    checkout.open()
  })
}
