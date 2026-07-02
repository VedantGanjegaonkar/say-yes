// Loads the Razorpay Checkout script on demand and resolves once `window.Razorpay`
// is available. Cached so repeated "Pay" clicks don't inject the script twice.
let promise = null

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (promise) return promise

  promise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay failed to initialise'))
    }
    s.onerror = () => {
      promise = null // allow a retry on the next click
      reject(new Error('Could not load the payment library'))
    }
    document.body.appendChild(s)
  })
  return promise
}
