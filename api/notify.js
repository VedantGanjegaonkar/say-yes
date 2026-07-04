import nodemailer from 'nodemailer'

// Server-only. Uses the Supabase service_role key (bypasses RLS) via the REST
// API — we deliberately avoid @supabase/supabase-js here so the function has no
// WebSocket/realtime dependency and stays lightweight on the Node runtime.
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const sbHeaders = () => ({
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
})

async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: sbHeaders() })
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function sbPatch(path, body, prefer = 'return=representation') {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: prefer },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase PATCH ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

function formatPlan(answers) {
  const songs = Array.isArray(answers.songs) ? answers.songs : []
  const when = answers.date ? new Date(answers.date).toLocaleString() : '(not picked)'
  return [
    '💕 SHE SAID YES! Here is the full plan:',
    '',
    `📅 When:     ${when}`,
    `📍 Where:    ${answers.venue || '(not picked)'}`,
    `💅 Vibe:     ${answers.fancy || '(not picked)'}`,
    `🍹 Drink:    ${answers.drink || '(not picked)'}`,
    `🎧 Playlist: ${songs.length ? songs.join(' | ') : '(not picked)'}`,
  ].join('\n')
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
  const slug = body?.slug
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  try {
    const forms = await sbGet(
      `forms?slug=eq.${encodeURIComponent(slug)}&select=id,creator_email,config`
    )
    const form = forms[0]
    if (!form) return res.status(404).json({ error: 'Form not found' })

    // Email is optional at creation time. With no recipient there's nowhere to
    // send — the responses are still saved, we just skip the email step.
    if (!form.creator_email) return res.status(200).json({ status: 'no-recipient', sent: 0 })

    // Responses saved but not yet emailed. Usually one; also acts as a sweep.
    const pending = await sbGet(
      `responses?form_id=eq.${form.id}&notified=eq.false&select=id,answers&order=submitted_at.asc`
    )
    if (!pending.length) return res.status(200).json({ status: 'already-sent', sent: 0 })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_PORT) === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    let sent = 0
    for (const r of pending) {
      // Atomically claim this row so a duplicate/retried POST can't double-send.
      const claimed = await sbPatch(`responses?id=eq.${r.id}&notified=eq.false`, {
        notified: true,
      })
      if (!claimed.length) continue // already claimed by a concurrent request

      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM,
          to: form.creator_email,
          subject: '💕 She said YES! Date plan confirmed',
          text: formatPlan(r.answers),
        })
        sent++
      } catch (err) {
        // Roll back the claim so the response isn't silently marked as notified.
        await sbPatch(`responses?id=eq.${r.id}`, { notified: false }, 'return=minimal').catch(
          () => {}
        )
        throw err
      }
    }

    return res.status(200).json({ status: 'sent', sent })
  } catch (err) {
    console.error('notify failed:', err)
    return res.status(502).json({ error: 'Notify failed', detail: String(err.message || err) })
  }
}
