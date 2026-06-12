import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import frogSticker from '../assets/frog-sticker.webp'
import FakeLoader from '../components/FakeLoader.jsx'
import './Landing.css'

const LOADER_LINES = [
  'Processing your yes 💝',
  'No take-backs 😌',
  'Done ✅',
]

const TEASES = [
  'No',
  'Are you sure?',
  'Really sure??',
  'Think again 🥺',
  'Last chance!',
  'Please? 💔',
  "You can't catch me!",
]

export default function Landing() {
  const navigate = useNavigate()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tries, setTries] = useState(0)
  const [loading, setLoading] = useState(false)

  function runAway() {
    // Small, playful nudge — stays right near the card.
    const x = (Math.random() * 2 - 1) * 70 // -70..70
    const y = (Math.random() * 2 - 1) * 45 // -45..45
    setOffset({ x, y })
    setTries((t) => Math.min(t + 1, TEASES.length - 1))
  }

  // Yes grows a little every time No dodges 😄
  const yesScale = 1 + tries * 0.12

  return (
    <main className="landing">
      {loading && <FakeLoader lines={LOADER_LINES} onDone={() => navigate('/page-1')} />}

      <div className="card">
        <div className="photo">
          <img src={frogSticker} alt="frog sticker" />
        </div>

        <h1 className="question">
          🌸 Will you go on a date with me? 🌸
        </h1>

        <div className="actions">
          <button
            className="btn yes"
            style={{ transform: `scale(${yesScale})` }}
            onClick={() => setLoading(true)}
          >
            Yes 💕
          </button>

          <button
            className="btn no"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            onClick={runAway}
          >
            {TEASES[tries]}
          </button>
        </div>
      </div>
    </main>
  )
}
