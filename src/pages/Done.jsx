import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import { sendPlan } from '../lib/sendPlan.js'
import './shared.css'
import './Done.css'

function formatDate(value) {
  if (!value) return 'Whenever you like 💕'
  const d = new Date(value)
  if (isNaN(d)) return value
  return d.toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Done() {
  const { plan } = usePlan()
  const [mailStatus, setMailStatus] = useState('')
  const sentRef = useRef(false)

  useEffect(() => {
    // Only send once, and only if she actually went through the flow.
    if (sentRef.current || !plan.date) return
    sentRef.current = true
    sendPlan(plan).then(setMailStatus)
  }, [plan])

  return (
    <main className="page">
      <div className="confetti" aria-hidden="true">
        {'🎉💕🌸✨💖🎊'.repeat(8).split('').map((c, i) => (
          <span
            key={i}
            style={{ left: `${(i * 7) % 100}%`, animationDelay: `${(i % 10) * 0.25}s` }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="card">
        <div className="emoji">🥰</div>
        <h1 className="title">It's all set! 💕</h1>
        <p className="subtitle">Here's our date plan:</p>

        <ul className="summary">
          <li>
            <span className="k">📅 When</span>
            <span className="v">{formatDate(plan.date)}</span>
          </li>
          <li>
            <span className="k">📍 Where</span>
            <span className="v">{plan.venue || 'The universe decides 🪄'}</span>
          </li>
          <li>
            <span className="k">💅 Vibe</span>
            <span className="v">{plan.fancy || 'Five star, obviously'}</span>
          </li>
          <li>
            <span className="k">🍹 Drink</span>
            <span className="v">{plan.drink || 'Surprise me!'}</span>
          </li>
          <li>
            <span className="k">🎧 Playlist</span>
            <span className="v">
              {plan.songs.length ? plan.songs.join(', ') : 'Your choice 🎶'}
            </span>
          </li>
        </ul>

        <p className="subtitle" style={{ marginTop: 22, marginBottom: 0 }}>
          Can't wait to see you! 🌸
        </p>

        {mailStatus === 'sent' && (
          <p className="mail-note">💌 Delivered straight to my heart (and inbox)</p>
        )}

        <Link className="back-link" to="/">
          ← Start over
        </Link>
      </div>
    </main>
  )
}
