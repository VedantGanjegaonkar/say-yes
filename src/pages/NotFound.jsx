import './shared.css'

export default function NotFound() {
  return (
    <main className="page">
      <div className="card">
        <div className="emoji">🐸</div>
        <h1 className="title">Hmm, this link doesn't exist</h1>
        <p className="subtitle">
          The invite may have expired or the link is incomplete. Ask them to send it again 💕
        </p>
      </div>
    </main>
  )
}
