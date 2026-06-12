import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import FakeLoader from '../components/FakeLoader.jsx'
import './shared.css'
import './DatePick.css'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const UNLOCK_LINES = [
  "I was busy that day... but for you? I'll move everything 💕",
  "Had work then — cancelled. You matter more 🥰",
  "For you, I have ample time. Work can wait 💖",
  "Shifting my whole schedule... done. It's yours 🌸",
]

const LOADER_LINES = [
  'Checking my schedule 📅',
  'Cancelling my meetings 🚮',
  'Telling my mom 🙈',
  'Done ✅',
]

// Deterministic "busy" days — scattered, stable across renders.
function isBusyDay(y, m, d) {
  const s = y * 373 + m * 37 + d * 7
  return s % 10 === 2 || s % 10 === 5 || s % 10 === 8
}

// Deterministic fake forecast — some days "rain", none of them matter 😌
function isRainyDay(y, m, d) {
  const s = y * 211 + m * 53 + d * 11
  return s % 3 === 0
}

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function DatePick() {
  const navigate = useNavigate()
  const { update } = usePlan()

  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState('')
  const [unlocked, setUnlocked] = useState([]) // busy dates she freed up 💕
  const [message, setMessage] = useState('')
  const [time, setTime] = useState('19:00')
  const [weather, setWeather] = useState(null) // null | 'checking' | 'rain' | 'clear'
  const [loading, setLoading] = useState(false)
  const weatherTimer = useRef(null)

  useEffect(() => () => clearTimeout(weatherTimer.current), [])

  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth()

  function prevMonth() {
    if (isCurrentMonth) return
    setView(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  }

  function nextMonth() {
    setView(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))
  }

  function pickDay(d, busy, isPast) {
    if (isPast) return
    const key = ymd(view.y, view.m, d)
    if (busy && !unlocked.includes(key)) {
      // The loving gesture: busy date melts away for her 💕
      setUnlocked((u) => [...u, key])
      setMessage(UNLOCK_LINES[unlocked.length % UNLOCK_LINES.length])
    } else {
      setMessage('')
    }
    setSelected(key)

    // Fake weather check — rain is never a problem 😌
    setWeather('checking')
    clearTimeout(weatherTimer.current)
    weatherTimer.current = setTimeout(() => {
      setWeather(isRainyDay(view.y, view.m, d) ? 'rain' : 'clear')
    }, 800)
  }

  function next() {
    update({ date: `${selected}T${time}` })
    setLoading(true)
  }

  return (
    <main className="page">
      {loading && <FakeLoader lines={LOADER_LINES} onDone={() => navigate('/page-2')} />}

      <div className="card">
        <div className="step">Step 1 of 5</div>
        <div className="emoji">📅</div>
        <h1 className="title">Yaaay! When are you free? 💕</h1>
        <p className="subtitle">Pick a day & time for our date</p>

        <div className="cal">
          <div className="cal-head">
            <button
              className="cal-nav"
              onClick={prevMonth}
              disabled={isCurrentMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="cal-month">
              {MONTHS[view.m]} {view.y}
            </span>
            <button className="cal-nav" onClick={nextMonth} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="cal-grid">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="cal-wd">
                {w}
              </span>
            ))}

            {Array.from({ length: firstDay }, (_, i) => (
              <span key={`b${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1
              const key = ymd(view.y, view.m, d)
              const isPast =
                isCurrentMonth && d < today.getDate()
              const busy = isBusyDay(view.y, view.m, d) && !unlocked.includes(key)
              const cls = [
                'cal-day',
                isPast && 'past',
                busy && 'busy',
                selected === key && 'selected',
                unlocked.includes(key) && 'freed',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={key}
                  className={cls}
                  disabled={isPast}
                  title={busy ? 'Hmm, I might be busy that day... 😏 (tap me)' : undefined}
                  onClick={() => pickDay(d, busy, isPast)}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {message && <p className="love-note">{message}</p>}

        {weather === 'checking' && (
          <p className="weather-note checking">🛰️ Checking the weather that day...</p>
        )}
        {weather === 'rain' && (
          <p className="weather-note">
            ☔ Forecast says rain that day... doesn't matter. Umbrella ready —
            I'll pick you up at your door 🚗💕
          </p>
        )}
        {weather === 'clear' && (
          <p className="weather-note">🌤️ Clear skies that day — even the universe approves ✨</p>
        )}

        <div className="time-row">
          <label htmlFor="time">🕖 At</label>
          <input
            id="time"
            className="time-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div>
          <button className="btn primary" disabled={!selected} onClick={next}>
            Next →
          </button>
        </div>
      </div>
    </main>
  )
}
