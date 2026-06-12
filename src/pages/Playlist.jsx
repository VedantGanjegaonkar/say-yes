import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext.jsx'
import './shared.css'
import './Playlist.css'

const SONGS = [
  '🎵 Aaoge Tum Kabhi',
  '🎶 Aadat',
  '🎤 Slow Motion Angreza (sing together!)',
]

export default function Playlist() {
  const navigate = useNavigate()
  const { update } = usePlan()
  const [selected, setSelected] = useState([])
  const [otherOn, setOtherOn] = useState(false)
  const [otherText, setOtherText] = useState('')

  function toggle(song) {
    setSelected((s) =>
      s.includes(song) ? s.filter((x) => x !== song) : [...s, song]
    )
  }

  function finish() {
    const songs = [...selected]
    if (otherOn && otherText.trim()) songs.push(otherText.trim())
    update({ songs })
    navigate('/done')
  }

  const hasPick = selected.length > 0 || (otherOn && otherText.trim())

  return (
    <main className="page">
      <div className="card">
        <div className="step">Step 3 of 3</div>
        <div className="emoji">🎧</div>
        <h1 className="title">Build our drunk playlist 🍻</h1>
        <p className="subtitle">Pick all the bangers (multiple allowed)</p>

        <div className="songs">
          {SONGS.map((song) => (
            <label
              key={song}
              className={`song ${selected.includes(song) ? 'on' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(song)}
                onChange={() => toggle(song)}
              />
              <span>{song}</span>
            </label>
          ))}

          <label className={`song ${otherOn ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={otherOn}
              onChange={(e) => setOtherOn(e.target.checked)}
            />
            <span>➕ Any other</span>
          </label>

          {otherOn && (
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
