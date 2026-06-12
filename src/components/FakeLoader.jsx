import { useEffect, useState } from 'react'
import './FakeLoader.css'

// Fake loading overlay — shows each caption with a spinner,
// ticks them off one by one, then calls onDone.
export default function FakeLoader({ lines, onDone }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= lines.length) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s + 1), 900)
    return () => clearTimeout(t)
  }, [step, lines.length, onDone])

  return (
    <div className="loader-overlay">
      <div className="loader-card">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`loader-line ${
              i < step ? 'done' : i === step ? 'active' : 'pending'
            }`}
          >
            <span className="mark">{i < step ? '✅' : '⏳'}</span>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
