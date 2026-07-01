import { useState } from 'react'
import defaultSticker from '../assets/default-sticker.webp'
import FakeLoader from '../components/FakeLoader.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { useFlowNav } from '../recipient/useFlowNav.js'
import './Landing.css'

export default function Landing() {
  const { config } = useConfig()
  const c = config.content.landing
  const flow = useFlowNav('landing')
  const stickerUrl = config.sticker?.url || defaultSticker

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tries, setTries] = useState(0)
  const [loading, setLoading] = useState(false)

  function runAway() {
    // Small, playful nudge — stays right near the card.
    const x = (Math.random() * 2 - 1) * 70 // -70..70
    const y = (Math.random() * 2 - 1) * 45 // -45..45
    setOffset({ x, y })
    setTries((t) => Math.min(t + 1, c.teases.length - 1))
  }

  // Yes grows a little every time No dodges 😄
  const yesScale = 1 + tries * 0.12

  return (
    <main className="landing">
      {loading && <FakeLoader lines={c.loaderMessages} onDone={flow.next} />}

      <div className="card">
        <div className="photo">
          <img src={stickerUrl} alt="sticker" />
        </div>

        <h1 className="question">{c.invitation}</h1>

        <div className="actions">
          <button
            className="btn yes"
            style={{ transform: `scale(${yesScale})` }}
            onClick={() => setLoading(true)}
          >
            {c.yesLabel}
          </button>

          <button
            className="btn no"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            onClick={runAway}
          >
            {c.teases[tries] ?? c.noLabel}
          </button>
        </div>
      </div>
    </main>
  )
}
