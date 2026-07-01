import { useState } from 'react'
import FakeLoader from '../components/FakeLoader.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { useFlowNav } from '../recipient/useFlowNav.js'
import './shared.css'
import './Budget.css'

export default function Budget() {
  const { config } = useConfig()
  const c = config.content.budget
  const flow = useFlowNav('budget')
  const { update } = usePlan()

  const [fancy, setFancy] = useState(50)
  const [loading, setLoading] = useState(false)

  const bands = c.bands
  const band = bands.find((b) => fancy <= b.max) ?? bands[bands.length - 1]

  function next() {
    update({ fancy: `${band.emoji} ${band.label}` })
    setLoading(true)
  }

  return (
    <main className="page">
      {loading && <FakeLoader lines={c.loaderMessages} onDone={flow.next} />}

      <div className="card">
        <div className="step">Step {flow.step} of {flow.total}</div>
        <h1 className="title">{c.title}</h1>
        <p className="subtitle">{c.subtitle}</p>

        <div className="band-emoji">{band.emoji}</div>
        <div className="band-label">{band.label}</div>

        <div className="slider-row">
          <span>{bands[0]?.emoji}</span>
          <input
            className="fancy-slider"
            type="range"
            min="0"
            max="100"
            value={fancy}
            onChange={(e) => setFancy(Number(e.target.value))}
          />
          <span>{bands[bands.length - 1]?.emoji}</span>
        </div>

        <p className="love-note">{band.line}</p>
        {c.noWrong && <p className="no-wrong">{c.noWrong}</p>}

        <button className="btn primary" onClick={next}>
          Next →
        </button>
      </div>
    </main>
  )
}
