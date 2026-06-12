import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import FakeLoader from '../components/FakeLoader.jsx'
import './shared.css'
import './Drinks.css'

const LOADER_LINES = [
  'Stocking the bar 🍾',
  'Hiding the vodka 🙈',
  'Done ✅',
]

const DRINKS = [
  { id: 'vodka', label: '🍸 Vodka', tease: true },
  { id: 'whisky', label: '🥃 Whisky' },
  { id: 'skosh', label: '🍹 Skosh' },
  { id: 'ram', label: '🍶 Ram' },
]

const VODKA_TEASE = ['🍸 Vodka', 'Not vodka 😜', 'Nope!', 'Try another 🙈', 'Anything but this!']

export default function Drinks() {
  const navigate = useNavigate()
  const { update } = usePlan()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tries, setTries] = useState(0)
  const [loading, setLoading] = useState(false)

  function dodge() {
    const x = (Math.random() * 2 - 1) * 70
    const y = (Math.random() * 2 - 1) * 45
    setOffset({ x, y })
    setTries((t) => Math.min(t + 1, VODKA_TEASE.length - 1))
  }

  function pick(drink) {
    update({ drink })
    setLoading(true)
  }

  return (
    <main className="page">
      {loading && <FakeLoader lines={LOADER_LINES} onDone={() => navigate('/page-5')} />}

      <div className="card">
        <div className="step">Step 4 of 5</div>
        <div className="emoji">🍹</div>
        <h1 className="title">Pick your poison 😏</h1>
        <p className="subtitle">What are we drinking on our date?</p>

        <div className="drinks">
          {DRINKS.map((d) =>
            d.tease ? (
              <button
                key={d.id}
                className="drink tease"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
                onClick={dodge}
              >
                {VODKA_TEASE[tries]}
              </button>
            ) : (
              <button key={d.id} className="drink" onClick={() => pick(d.label)}>
                {d.label}
              </button>
            )
          )}
        </div>
      </div>
    </main>
  )
}
