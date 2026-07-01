import { useState } from 'react'
import FakeLoader from '../components/FakeLoader.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { useFlowNav } from '../recipient/useFlowNav.js'
import './shared.css'
import './Drinks.css'

export default function Drinks() {
  const { config } = useConfig()
  const c = config.content.drinks
  const flow = useFlowNav('drinks')
  const { update } = usePlan()

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tries, setTries] = useState(0)
  const [loading, setLoading] = useState(false)

  function dodge() {
    const x = (Math.random() * 2 - 1) * 70
    const y = (Math.random() * 2 - 1) * 45
    setOffset({ x, y })
    setTries((t) => Math.min(t + 1, c.teaseLines.length - 1))
  }

  function pick(drink) {
    update({ drink })
    setLoading(true)
  }

  return (
    <main className="page">
      {loading && <FakeLoader lines={c.loaderMessages} onDone={flow.next} />}

      <div className="card">
        <div className="step">Step {flow.step} of {flow.total}</div>
        <div className="emoji">🍹</div>
        <h1 className="title">{c.title}</h1>
        <p className="subtitle">{c.subtitle}</p>

        <div className="drinks">
          {c.options.map((d) =>
            d.tease ? (
              <button
                key={d.id}
                className="drink tease"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
                onClick={dodge}
              >
                {c.teaseLines[tries] ?? d.label}
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
