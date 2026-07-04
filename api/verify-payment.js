import crypto from 'crypto'

// Server-only. The ONLY path that creates a paid form row. Accepts either a
// verified Razorpay payment or the internal bypass code, then inserts the form
// with the Supabase service_role key (bypassing RLS). Because RLS blocks anon
// inserts on `forms`, this is the sole way a link can be created — so the paywall
// cannot be skipped from the browser.
const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const BYPASS_CODE = process.env.BYPASS_CODE
const PRICE_PAISE = Number(process.env.LINK_PRICE_PAISE) || 900
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Length-safe constant-time string comparison.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

function sbHeaders(prefer) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer || 'return=minimal',
  }
}

// Insert the form. Tries the full row (with payment audit columns); if those
// columns don't exist yet, retries with just the core columns so the feature
// still works before the optional migration is run.
async function insertForm(core, extra) {
  let res = await fetch(`${SB_URL}/rest/v1/forms`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ ...core, ...extra }),
  })
  if (res.status === 400 && Object.keys(extra).length) {
    // Likely "column does not exist" — retry without the audit columns.
    res = await fetch(`${SB_URL}/rest/v1/forms`, {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify(core),
    })
  }
  return res
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Server not configured (Supabase env missing)' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }

  const slug = typeof body?.slug === 'string' ? body.slug : ''
  const config = body?.config
  const creatorEmail = typeof body?.creator_email === 'string' ? body.creator_email.trim() : ''
  const stickerPath = typeof body?.sticker_path === 'string' ? body.sticker_path : null

  if (!slug || !/^[A-Za-z0-9_-]{6,40}$/.test(slug)) return res.status(400).json({ error: 'Bad slug' })
  if (!config || typeof config !== 'object') return res.status(400).json({ error: 'Missing config' })
  // Email is optional; only reject a malformed one when the creator did type it.
  if (creatorEmail && !EMAIL_RE.test(creatorEmail)) return res.status(400).json({ error: 'Invalid email' })

  // ── Decide the path: bypass code, or verified Razorpay payment ──
  let extra
  const bypassCode = body?.bypassCode

  if (bypassCode !== undefined && bypassCode !== '') {
    if (!BYPASS_CODE || !safeEqual(String(bypassCode), BYPASS_CODE)) {
      return res.status(403).json({ error: 'Invalid code' })
    }
    extra = { bypass: true }
  } else {
    const orderId = body?.razorpay_order_id
    const paymentId = body?.razorpay_payment_id
    const signature = body?.razorpay_signature
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment fields' })
    }
    if (!KEY_SECRET) return res.status(500).json({ error: 'Server not configured (Razorpay secret missing)' })

    // 1) Signature proves Razorpay processed this payment for this order.
    const expected = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    if (!safeEqual(expected, String(signature))) {
      return res.status(403).json({ error: 'Payment verification failed' })
    }

    // 2) Confirm the captured amount/order with Razorpay (defense in depth).
    //    Network hiccup here is non-fatal — the signature already authenticated it.
    try {
      const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
      const pr = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Basic ${auth}` },
      })
      if (pr.ok) {
        const pay = await pr.json()
        const ok = pay.order_id === orderId && Number(pay.amount) === PRICE_PAISE &&
          (pay.status === 'captured' || pay.status === 'authorized')
        if (!ok) return res.status(403).json({ error: 'Payment not valid for this order' })
      }
    } catch (e) {
      console.warn('payment cross-check skipped:', String(e.message || e))
    }

    extra = { razorpay_order_id: orderId, razorpay_payment_id: paymentId, paid_at: new Date().toISOString() }
  }

  // ── Create the form (service_role bypasses RLS) ──
  try {
    const core = { slug, config, creator_email: creatorEmail || null, sticker_path: stickerPath }
    const ins = await insertForm(core, extra)
    if (ins.status === 409) {
      // Same slug already created (a retry) — treat as success, idempotent.
      return res.status(200).json({ slug })
    }
    if (!ins.ok) {
      throw new Error(`Supabase insert ${ins.status}: ${await ins.text()}`)
    }
    return res.status(200).json({ slug })
  } catch (err) {
    console.error('verify-payment insert failed:', err)
    return res.status(502).json({ error: 'Could not create link', detail: String(err.message || err) })
  }
}
