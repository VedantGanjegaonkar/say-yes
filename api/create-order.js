// Server-only. Creates a Razorpay order for the pay-to-generate gate.
// Talks to the Razorpay REST API directly (Basic auth) — no SDK dependency.
// The amount is fixed here on the server so the client can't tamper with the price.
const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const PRICE_PAISE = Number(process.env.LINK_PRICE_PAISE) || 900 // ₹9 default

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!KEY_ID || !KEY_SECRET) {
    return res.status(500).json({ error: 'Server not configured (Razorpay keys missing)' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  // `slug` is only used as the order receipt for traceability; `email` goes in notes.
  const slug = typeof body?.slug === 'string' ? body.slug.slice(0, 40) : undefined
  const email = typeof body?.email === 'string' ? body.email.slice(0, 120) : undefined

  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: PRICE_PAISE,
        currency: 'INR',
        receipt: slug || `link_${Date.now()}`,
        notes: email ? { email } : undefined,
      }),
    })
    const order = await r.json()
    if (!r.ok) {
      throw new Error(order?.error?.description || `Razorpay ${r.status}`)
    }
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
    })
  } catch (err) {
    console.error('create-order failed:', err)
    return res.status(502).json({ error: 'Could not start payment', detail: String(err.message || err) })
  }
}
