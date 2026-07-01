import { useState } from 'react'
import FakeLoader from '../components/FakeLoader.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { useFlowNav } from '../recipient/useFlowNav.js'
import './shared.css'
import './Playlist.css'

export default function Playlist() {
  const { config } = useConfig()
  const c = config.content.playlist
  const flow = useFlowNav('playlist')
  const { update } = usePlan()

  const [selected, setSelected] = useState([])
  const [otherOn, setOtherOn] = useState(false)
  const [otherText, setOtherText] = useState('')
  const [loading, setLoading] = useState(false)

  function toggle(song) {
    setSelected((s) => (s.includes(song) ? s.filter((x) => x !== song) : [...s, song]))
  }

  function finish() {
    const songs = [...selected]
    if (c.allowCustom && otherOn && otherText.trim()) songs.push(otherText.trim())
    update({ songs })
    setLoading(true)
  }

  const hasPick = selected.length > 0 || (c.allowCustom && otherOn && otherText.trim())

  return (
    <main className="page">
      {loading && <FakeLoader lines={c.loaderMessages} onDone={flow.next} />}

      <div className="card">
        <div className="step">Step {flow.step} of {flow.total}</div>
        <div className="emoji">🎧</div>
        <h1 className="title">{c.title}</h1>
        <p className="subtitle">{c.subtitle}</p>

        <div className="songs">
          {c.suggestions.map((song) => (
            <label key={song} className={`song ${selected.includes(song) ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(song)}
                onChange={() => toggle(song)}
              />
              <span>{song}</span>
            </label>
          ))}

          {c.allowCustom && (
            <label className={`song ${otherOn ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={otherOn}
                onChange={(e) => setOtherOn(e.target.checked)}
              />
              <span>{c.customLabel}</span>
            </label>
          )}

          {c.allowCustom && otherOn && (
            <input
              className="other-input"
              type="text"
              placeholder="Type your song..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <button className="btn primary" disabled={!hasPick} onClick={finish}>
          Finish 🎉
        </button>
      </div>
    </main>
  )
}
