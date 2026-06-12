import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import FakeLoader from '../components/FakeLoader.jsx'
import './shared.css'
import './Budget.css'

const BANDS = [
  { max: 25, emoji: '🍜', label: 'Street food', line: 'Elite taste. Pani-puri dates are the best dates 🍜💕' },
  { max: 50, emoji: '☕', label: 'Cozy cafe', line: 'A quiet corner, two coffees, and you. Perfect ☕💖' },
  { max: 75, emoji: '🍽️', label: 'Fancy dinner', line: "Ooh fancy! I'm ironing my shirt already 😄" },
  { max: 100, emoji: '🥂', label: 'Five star', line: 'Anything for you. Booking the rooftop 🥂' },
]

const LOADER_LINES = [
  'Breaking my piggy bank 🐷',
  'Counting my savings 💸',
  'Worth every rupee. Done ✅',
]

export default function Budget() {
  const navigate = useNavigate()
  const { update } = usePlan()
  const [fancy, setFancy] = useState(50)
  const [loading, setLoading] = useState(false)

  const band = BANDS.find((b) => fancy <= b.max)

  function next() {
    update({ fancy: `${band.emoji} ${band.label}` })
    setLoading(true)
  }

  return (
    <main className="page">
      {loading && <FakeLoader lines={LOADER_LINES} onDone={() => navigate('/page-4')} />}

      <div className="card">
        <div className="step">Step 3 of 5</div>
        <h1 className="title">How fancy are we going? 💅</h1>
        <p className="subtitle">Slide to set the vibe</p>

        <div className="band-emoji">{band.emoji}</div>
        <div className="band-label">{band.label}</div>

        <div className="slider-row">
          <span>🍜</span>
          <input
            className="fancy-slider"
            type="range"
            min="0"
            max="100"
            value={fancy}
            onChange={(e) => setFancy(Number(e.target.value))}
          />
          <span>🥂</span>
        </div>

        <p className="love-note">{band.line}</p>
        <p className="no-wrong">
          (there's no wrong answer — anywhere with you is five-star anyway 💖)
        </p>

        <button className="btn primary" onClick={next}>
          Next →
        </button>
      </div>
    </main>
  )
}
