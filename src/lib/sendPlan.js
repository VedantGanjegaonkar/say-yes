import { WEB3FORMS_ACCESS_KEY } from '../config.js'

function formatDate(value) {
  if (!value) return '(not picked)'
  const d = new Date(value)
  if (isNaN(d)) return value
  return d.toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Emails the full plan to you via Web3Forms.
// Returns 'sent' | 'skipped' | 'failed'.
export async function sendPlan(plan) {
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.startsWith('YOUR_')) {
    console.warn('sendPlan: no Web3Forms access key set in src/config.js — skipping email')
    return 'skipped'
  }

  const message = [
    '💕 SHE SAID YES! Here is the full plan:',
    '',
    `📅 When:     ${formatDate(plan.date)}`,
    `📍 Where:    ${plan.venue || '(not picked)'}`,
    `💅 Vibe:     ${plan.fancy || '(not picked)'}`,
    `🍹 Drink:    ${plan.drink || '(not picked)'}`,
    `🎧 Playlist: ${plan.songs.length ? plan.songs.join(' | ') : '(not picked)'}`,
    '',
    `Submitted: ${new Date().toLocaleString()}`,
  ].join('\n')

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: '💕 She said YES! Date plan confirmed',
        from_name: 'DateForm 🐸',
        message,
      }),
    })
    const data = await res.json()
    return data.success ? 'sent' : 'failed'
  } catch (err) {
    console.warn('sendPlan failed:', err)
    return 'failed'
  }
}
