import { useEffect, useRef, useState } from 'react'
import FakeLoader from '../components/FakeLoader.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { useFlowNav } from '../recipient/useFlowNav.js'
import './shared.css'
import './Wheel.css'

export default function Wheel() {
  const { config } = useConfig()
  const c = config.content.wheel
  const flow = useFlowNav('wheel')
  const { update } = usePlan()

  const venues = c.venues
  const seg = 360 / venues.length
  const rigged = Math.min(Math.max(c.riggedIndex ?? 0, 0), venues.length - 1)

  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinCount, setSpinCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  function spin() {
    if (spinning) return
    setSpinning(true)
    const center = rigged * seg + seg / 2
    const jitter = (Math.random() - 0.5) * seg * 0.6 // looks organic, still lands right
    setRot((r) => {
      const current = ((r % 360) + 360) % 360
      const targetMod = (((360 - center + jitter) % 360) + 360) % 360
      const delta = (targetMod - current + 360) % 360
      return r + 360 * 5 + delta
    })
    timer.current = setTimeout(() => {
      setSpinning(false)
      setSpinCount((count) => count + 1)
    }, 4300)
  }

  function next() {
    update({ venue: `${venues[rigged].emoji} ${venues[rigged].label}` })
    setLoading(true)
  }

  const landed = spinCount > 0 && !spinning
  const winner = venues[rigged]

  return (
    <main className="page">
      {loading && <FakeLoader lines={c.loaderMessages} onDone={flow.next} />}

      <div className="card">
        <div className="step">Step {flow.step} of {flow.total}</div>
        <h1 className="title">{c.title}</h1>
        <p className="subtitle">{c.subtitle}</p>

        <div className="wheel-wrap">
          <div className="pointer">▼</div>
          <div className="wheel" style={{ transform: `rotate(${rot}deg)` }}>
            {venues.map((v, i) => {
              const angle = i * seg + seg / 2
              return (
                <span
                  key={`${v.label}-${i}`}
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
