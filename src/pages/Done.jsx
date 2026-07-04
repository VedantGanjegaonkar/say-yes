import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { supabase } from '../lib/supabase.js'
import './shared.css'
import './Done.css'

function formatDate(value, fallback) {
  if (!value) return fallback
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
  const { config, formId, slug, preview } = useConfig()
  const c = config.content.done
  const fb = c.fallbacks
  const [saved, setSaved] = useState(false)
  const sentRef = useRef(false)

  useEffect(() => {
    // Submit once, and only if she actually went through the flow.
    // Never write to the DB from the builder's live preview.
    if (sentRef.current || !plan.date || preview) return
    sentRef.current = true
    ;(async () => {
      const { error } = await supabase
        .from('responses')
        .insert({ form_id: formId, answers: plan })
      if (error) {
        console.warn('Saving response failed:', error.message)
        return
      }
      setSaved(true)
      // Fire the email notification (best-effort; response is already saved).
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
      } catch {
        /* serverless function may be absent in plain `vite dev`; ignore */
      }
    })()
  }, [plan, formId, slug, preview])

  return (
    <main className="page">
      <div className="confetti" aria-hidden="true">
        {c.confetti.repeat(8).split('').map((ch, i) => (
          <span
            key={i}
            style={{ left: `${(i * 7) % 100}%`, animationDelay: `${(i % 10) * 0.25}s` }}
          >
            {ch}
          </span>
        ))}
      </div>

      <div className="card">
        <div className="emoji">🥰</div>
        <h1 className="title">{c.title}</h1>
        <p className="subtitle">{c.subtitle}</p>

        <ul className="summary">
          <li>
            <span className="k">📅 When</span>
            <span className="v">{formatDate(plan.date, fb.date)}</span>
          </li>
          <li>
            <span className="k">📍 Where</span>
            <span className="v">{plan.venue || fb.venue}</span>
          </li>
          <li>
            <span className="k">💅 Vibe</span>
            <span className="v">{plan.fancy || fb.fancy}</span>
          </li>
          <li>
            <span className="k">🍹 Drink</span>
            <span className="v">{plan.drink || fb.drink}</span>
          </li>
          <li>
            <span className="k">🎧 Playlist</span>
            <span className="v">{plan.songs.length ? plan.songs.join(', ') : fb.songs}</span>
          </li>
        </ul>

        <p className="subtitle" style={{ marginTop: 22, marginBottom: 0 }}>
          {c.closing}
        </p>

        {saved && <p className="mail-note">💌 Delivered straight to their heart (and inbox)</p>}

        {/* The viral loop: the person who was just asked out becomes the next
            person doing the asking. Only in the real flow — never the builder preview. */}
        {!preview && (
          <Link className="make-your-own" to="/build">
            <span className="myo-icon">💌</span>
            <span className="myo-copy">
              <strong>Made with Say Yes No No</strong>
              <span className="myo-sub">Got someone in mind? Make your own →</span>
            </span>
          </Link>
        )}

        <Link className="back-link" to={`/f/${slug}`}>
          ← Start over
        </Link>
      </div>
    </main>
  )
}
