import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import FakeLoader from '../components/FakeLoader.jsx'
import './shared.css'
import './Wheel.css'

const VENUES = [
  { emoji: '☕', label: 'Cozy cafe' },
  { emoji: '🚗', label: 'Long drive' },
  { emoji: '🌃', label: 'Rooftop dinner' },
  { emoji: '🎬', label: 'Movie night' },
  { emoji: '🍜', label: 'Street food walk' },
  { emoji: '🌅', label: 'Beach sunset' },
]

// 👇 The wheel ALWAYS lands here. Change index to your actual plan 😉
const RIGGED = 2
const SEG = 360 / VENUES.length

const LOADER_LINES = [
  'Calling the venue ☎️',
  'Bribing for the best table 😌',
  'Done ✅',
]

export default function Wheel() {
  const navigate = useNavigate()
  const { update } = usePlan()
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function spin() {
    if (spinning) return
    setSpinning(true)
    const center = RIGGED * SEG + SEG / 2
    const jitter = (Math.random() - 0.5) * SEG * 0.6 // looks organic, still lands right
    setRot((r) => {
      const current = ((r % 360) + 360) % 360
      const targetMod = (((360 - center + jitter) % 360) + 360) % 360
      const delta = (targetMod - current + 360) % 360
      return r + 360 * 5 + delta
    })
    timer.current = setTimeout(() => {
      setSpinning(false)
      setSpinCount((c) => c + 1)
    }, 4300)
  }

  function next() {
    update({ venue: `${VENUES[RIGGED].emoji} ${VENUES[RIGGED].label}` })
    setLoading(true)
  }

  const landed = spinCount > 0 && !spinning
  const winner = VENUES[RIGGED]

  return (
    <main className="page">
      {loading && <FakeLoader lines={LOADER_LINES} onDone={() => navigate('/page-3')} />}

      <div className="card">
        <div className="step">Step 2 of 5</div>
        <h1 className="title">Spin for our date spot! 🎡</h1>
        <p className="subtitle">Let the universe decide where we go...</p>

        <div className="wheel-wrap">
          <div className="pointer">▼</div>
          <div className="wheel" style={{ transform: `rotate(${rot}deg)` }}>
            {VENUES.map((v, i) => {
              const angle = i * SEG + SEG / 2
              return (
                <span
                  key={v.label}
                  className="wheel-label"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-92px) rotate(${-angle}deg)`,
                  }}
                >
                  {v.emoji}
                </span>
              )
            })}
            <div className="hub">💘</div>
          </div>
        </div>

        {landed && (
          <p className="love-note">
            {spinCount === 1
              ? `🪄 The universe has decided: ${winner.emoji} ${winner.label}!`
              : `Spun again? The universe insists 😌 ${winner.emoji} ${winner.label} it is.`}
          </p>
        )}

        <div className="wheel-actions">
          <button className="btn spin-btn" onClick={spin} disabled={spinning}>
            {spinning ? 'Spinning... 🤞' : landed ? 'Spin again 🎲' : 'Spin! 🎡'}
          </button>
          <button className="btn primary" disabled={!landed} onClick={next}>
            Next →
          </button>
        </div>
      </div>
    </main>
  )
}
