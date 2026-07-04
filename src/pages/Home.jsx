import { useNavigate } from 'react-router-dom'
import './shared.css'
import './Home.css'

const FEATURES = [
  {
    id: 'builder',
    eyebrow: 'The builder',
    title: 'Build it in minutes',
    body: 'Drag, drop, and customize a playful multi-step ask — the date pick, the spin wheel, the budget, the drinks, the playlist. No login, no setup. Just make it yours.',
    video: '/builder-demo.mp4',
    reverse: false,
  },
  {
    id: 'endform',
    eyebrow: 'What they see',
    title: 'Watch them say yes',
    body: 'Send one private link and they step through a delightful little flow that ends in a real plan. Every answer lands back with you — no accounts, no friction.',
    video: '/end-form-demo.mp4',
    reverse: true,
  },
]

const STEPS = [
  { icon: '✏️', title: 'Build', body: 'Pick your steps and write the copy in the builder.' },
  { icon: '👀', title: 'Preview', body: 'See exactly what they’ll see, live as you edit.' },
  { icon: '🔗', title: 'Share', body: 'Hit generate to get a private link to send them.' },
]

function FeatureVideo({ src }) {
  return (
    <div className="home-feature-media">
      <div className="home-media-glow" aria-hidden="true" />
      <video
        className="home-media-video"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  const scrollToHow = () => {
    document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home">
      <nav className="home-nav">
        <span className="home-wordmark">Say Yes No No 💌</span>
        <button className="btn ghost small" onClick={() => navigate('/build')}>
          Start building
        </button>
      </nav>

      <header className="home-hero">
        <div className="home-aurora" aria-hidden="true" />
        <div className="home-hero-inner">
          <span className="home-eyebrow">No login · one link · pure charm</span>
          <h1 className="home-hero-title">
            Build a date they’ll<br />
            <span className="home-grad">actually say yes to</span>
          </h1>
          <p className="home-hero-sub">
            Say Yes No No turns “wanna hang out?” into a playful little flow you design in
            minutes and send as a single private link.
          </p>
          <div className="home-cta-row">
            <button className="btn primary" onClick={() => navigate('/build')}>
              Start building
            </button>
            <button className="btn ghost" onClick={scrollToHow}>
              See how it works
            </button>
          </div>
        </div>
      </header>

      <main className="home-features">
        {FEATURES.map((f) => (
          <section
            key={f.id}
            className={`home-feature${f.reverse ? ' reverse' : ''}`}
          >
            <div className="home-feature-copy">
              <span className="home-eyebrow">{f.eyebrow}</span>
              <h2 className="home-feature-title">{f.title}</h2>
              <p className="home-feature-body">{f.body}</p>
            </div>
            <FeatureVideo src={f.video} />
          </section>
        ))}
      </main>

      <section className="home-how" id="how">
        <h2 className="home-how-title">How it works</h2>
        <p className="home-how-sub">Three steps from idea to a link in their inbox.</p>
        <div className="home-steps">
          {STEPS.map((s, i) => (
            <div className="home-step" key={s.title}>
              <div className="home-step-icon">{s.icon}</div>
              <h3 className="home-step-title">{s.title}</h3>
              <p className="home-step-body">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span className="home-step-arrow" aria-hidden="true">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="home-final">
        <div className="home-aurora soft" aria-hidden="true" />
        <div className="home-final-inner">
          <h2 className="home-final-title">Ready to ask?</h2>
          <p className="home-final-sub">Build your first date form in a couple of minutes.</p>
          <button className="btn primary" onClick={() => navigate('/build')}>
            Start building
          </button>
        </div>
      </section>

      <footer className="home-footer">
        <span className="home-wordmark">Say Yes No No 💌</span>
        <span className="home-footer-note">Made for the brave · © Say Yes No No</span>
      </footer>
    </div>
  )
}
