import { useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase.js'
import { loadRazorpay } from '../lib/razorpay.js'
import {
  cloneDefaultConfig,
  PAGE_TITLES,
  INVITATION_PLACEHOLDER,
  INVITATION_QUICK_PICKS,
} from '../lib/defaults.js'
import { Field, StringList, ObjectList } from './fields.jsx'
import PreviewPane from './PreviewPane.jsx'
import defaultSticker from '../assets/default-sticker.webp'
import './Builder.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// On touch devices, autofocusing the invitation field pops the keyboard and
// yanks the cursor there the moment the builder loads — skip autofocus there.
const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window)
const MAX_STICKER_BYTES = 1024 * 1024 // 1 MB
const OK_TYPES = ['image/webp', 'image/png', 'image/jpeg']
const PAGE_ICONS = { datepick: '📅', wheel: '🎡', budget: '💅', drinks: '🍹', playlist: '🎧' }

// Tucks secondary fields behind a tap so each step stays short on mobile.
function More({ children }) {
  return (
    <details className="b-more">
      <summary>More options</summary>
      <div className="b-more-body">{children}</div>
    </details>
  )
}

export default function Builder() {
  const [config, setConfig] = useState(cloneDefaultConfig)
  const [email, setEmail] = useState('')
  const [stickerFile, setStickerFile] = useState(null)
  const [stickerPreview, setStickerPreview] = useState(null)
  const [stickerUrl, setStickerUrl] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [mobilePreview, setMobilePreview] = useState(false)
  // Which page the modal preview opens on: null → the current step's page;
  // a page id (e.g. 'landing') → walk the flow from that point.
  const [previewStart, setPreviewStart] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [bypassCode, setBypassCode] = useState('')

  const patch = (fn) =>
    setConfig((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  const setC = (page, key) => (val) => patch((c) => {
    c.content[page][key] = val
  })
  const togglePage = (id) => patch((c) => {
    const p = c.pages.find((pg) => pg.id === id)
    if (p) p.enabled = !p.enabled
  })

  const C = config.content
  const enabledPages = config.pages.filter((p) => p.enabled).map((p) => p.id)
  const skippedIds = new Set(config.pages.filter((p) => !p.enabled).map((p) => p.id))

  const steps = [
    { id: 'landing', label: 'The ask', icon: '🌸', preview: 'landing' },
    ...config.pages.map((p) => ({ id: p.id, label: PAGE_TITLES[p.id], icon: PAGE_ICONS[p.id], preview: p.id })),
    { id: 'done', label: 'The finish', icon: '🎉', preview: 'done' },
    { id: 'share', label: 'Share it', icon: '🔗', preview: 'done' },
  ]
  const idx = Math.min(stepIndex, steps.length - 1)
  const step = steps[idx]
  const isFirst = idx === 0
  const isShare = step.id === 'share'
  const isQuestion = skippedIds.has(step.id) || enabledPages.includes(step.id)
  const isSkipped = skippedIds.has(step.id)

  const previewConfig = {
    ...config,
    sticker: { url: stickerPreview || stickerUrl || config.sticker?.url || null },
  }

  function onStickerChange(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!OK_TYPES.includes(file.type)) return setError('Sticker must be a WEBP, PNG, or JPEG image.')
    if (file.size > MAX_STICKER_BYTES) return setError('Sticker must be under 1 MB.')
    setStickerFile(file)
    setStickerPreview(URL.createObjectURL(file))
    setStickerUrl('')
  }

  function validate() {
    // Email is optional — but if one's typed, it has to be well-formed.
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setError('That email looks off — fix it, or clear it to skip.')
      return false
    }
    if (!enabledPages.length) {
      setError('Enable at least one question page.')
      return false
    }
    return true
  }

  // Validate + upload the sticker + build the config. Returns { slug, cfg, stickerPath }.
  // The actual `forms` row is created server-side (after payment / code) — anon
  // inserts are locked by RLS, so this can't create the link on its own.
  async function prepareForm() {
    const slug = nanoid(12)
    const cfg = structuredClone(config)
    let stickerPath = null

    if (stickerFile) {
      const ext = (stickerFile.name.split('.').pop() || 'png').toLowerCase()
      const path = `${slug}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('stickers')
        .upload(path, stickerFile, { upsert: false, contentType: stickerFile.type })
      if (upErr) {
        throw new Error(`Sticker upload failed (${upErr.message}). You can paste an image URL instead.`)
      }
      const { data } = supabase.storage.from('stickers').getPublicUrl(path)
      cfg.sticker = { url: data.publicUrl }
      stickerPath = path
    } else if (stickerUrl.trim()) {
      cfg.sticker = { url: stickerUrl.trim() }
    }
    return { slug, cfg, stickerPath }
  }

  // Server creates the form (verifying payment or the bypass code) and returns the slug.
  async function createForm({ slug, cfg, stickerPath }, gate) {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        config: cfg,
        creator_email: email.trim(),
        sticker_path: stickerPath,
        ...gate,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
    return data.slug || slug
  }

  // Paid path: create a Razorpay order → open checkout → verify server-side → link.
  async function payAndGenerate() {
    setError('')
    setResult(null)
    setCopied(false)
    if (!validate()) return

    setGenerating(true)
    try {
      const prepared = await prepareForm()

      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: prepared.slug, email: email.trim() }),
      })
      const order = await orderRes.json().catch(() => ({}))
      if (!orderRes.ok) throw new Error(order.error || 'Could not start payment')

      const Razorpay = await loadRazorpay()
      await new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: 'Say Yes No No',
          description: 'Your date link',
          prefill: { email: email.trim() },
          theme: { color: '#22d3ee' },
          handler: async (resp) => {
            try {
              const slug = await createForm(prepared, {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              })
              setResult({ slug, link: `${window.location.origin}/f/${slug}` })
              resolve()
            } catch (e) {
              reject(e)
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled — you weren’t charged.')) },
        })
        rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed.')))
        rzp.open()
      })
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setGenerating(false)
    }
  }

  // Bypass path: an internal code generates the link for free (verified server-side).
  async function redeemCode() {
    setError('')
    setResult(null)
    setCopied(false)
    if (!validate()) return
    const code = bypassCode.trim()
    if (!code) {
      setError('Enter your team code.')
      return
    }

    setGenerating(true)
    try {
      const prepared = await prepareForm()
      const slug = await createForm(prepared, { bypassCode: code })
      setResult({ slug, link: `${window.location.origin}/f/${slug}` })
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setGenerating(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(result.link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1))
  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1))

  // Swipe left/right to move between steps (ignored on inputs so text selection works).
  const touch = useRef(null)
  const onTouchStart = (e) => {
    if (e.target.closest('input, textarea, select')) return (touch.current = null)
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx < 0) goNext()
    else goPrev()
  }

  // One-tap create using all defaults — jump to Share (email + pay live there).
  function quickCreate() {
    setStepIndex(steps.length - 1)
    payAndGenerate()
  }

  function renderStep() {
    switch (step.id) {
      case 'landing':
        return (
          <>
            <Field
              label="Invitation"
              value={C.landing.invitation}
              onChange={setC('landing', 'invitation')}
              placeholder={INVITATION_PLACEHOLDER}
              className="fld-invite"
              textarea
              autoFocus={!IS_TOUCH}
            />
            <div className="quick-picks">
              <span className="quick-picks-label">Quick picks</span>
              {INVITATION_QUICK_PICKS.map((q) => (
                <button
                  type="button"
                  key={q}
                  className="quick-pick"
                  onClick={() => setC('landing', 'invitation')(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="sticker-box">
              <span className="fld-label">Sticker</span>
              <div className="sticker-row">
                <div className="sticker-preview">
                  <img src={stickerPreview || stickerUrl || defaultSticker} alt="sticker preview" />
                </div>
                <div className="sticker-inputs">
                  <input type="file" accept="image/webp,image/png,image/jpeg" onChange={onStickerChange} />
                  <span className="or">or paste an image URL</span>
                  <input
                    type="text"
                    placeholder="https://…/photo.png"
                    value={stickerUrl}
                    onChange={(e) => {
                      setStickerUrl(e.target.value)
                      setStickerFile(null)
                      setStickerPreview(null)
                    }}
                  />
                </div>
              </div>
            </div>
            <More>
              <StringList label="“No” button teases (it dodges through these)" items={C.landing.teases} onChange={setC('landing', 'teases')} placeholder="No / Are you sure? …" />
              <StringList label="Loading captions" items={C.landing.loaderMessages} onChange={setC('landing', 'loaderMessages')} />
            </More>
          </>
        )

      case 'datepick':
        return (
          <>
            <Field label="Title" value={C.datepick.title} onChange={setC('datepick', 'title')} />
            <Field label="Subtitle" value={C.datepick.subtitle} onChange={setC('datepick', 'subtitle')} />
            <Field label="Default time" value={C.datepick.defaultTime} onChange={setC('datepick', 'defaultTime')} placeholder="19:00" />
            <More>
              <StringList label="Busy-day sweet lines" items={C.datepick.unlockLines} onChange={setC('datepick', 'unlockLines')} />
              <StringList label="Loading captions" items={C.datepick.loaderMessages} onChange={setC('datepick', 'loaderMessages')} />
            </More>
          </>
        )

      case 'wheel':
        return (
          <>
            <Field label="Title" value={C.wheel.title} onChange={setC('wheel', 'title')} />
            <Field label="Subtitle" value={C.wheel.subtitle} onChange={setC('wheel', 'subtitle')} />
            <ObjectList
              label="Venues"
              items={C.wheel.venues}
              onChange={setC('wheel', 'venues')}
              columns={[{ key: 'emoji', label: 'Emoji', width: 'sm' }, { key: 'label', label: 'Venue name' }]}
              makeEmpty={() => ({ emoji: '📍', label: '' })}
            />
            <label className="fld">
              <span className="fld-label">The wheel always lands on…</span>
              <select value={C.wheel.riggedIndex} onChange={(e) => setC('wheel', 'riggedIndex')(Number(e.target.value))}>
                {C.wheel.venues.map((v, i) => (
                  <option key={i} value={i}>{v.emoji} {v.label || `Venue ${i + 1}`}</option>
                ))}
              </select>
            </label>
            <More>
              <StringList label="Loading captions" items={C.wheel.loaderMessages} onChange={setC('wheel', 'loaderMessages')} />
            </More>
          </>
        )

      case 'budget':
        return (
          <>
            <Field label="Title" value={C.budget.title} onChange={setC('budget', 'title')} />
            <Field label="Subtitle" value={C.budget.subtitle} onChange={setC('budget', 'subtitle')} />
            <ObjectList
              label="Bands (low → high, by max %)"
              items={C.budget.bands}
              onChange={setC('budget', 'bands')}
              columns={[
                { key: 'max', label: 'Max', type: 'number', width: 'sm' },
                { key: 'emoji', label: 'Emoji', width: 'sm' },
                { key: 'label', label: 'Label' },
                { key: 'line', label: 'Sweet line' },
              ]}
              makeEmpty={() => ({ max: 100, emoji: '💖', label: '', line: '' })}
            />
            <More>
              <Field label="Reassurance line" value={C.budget.noWrong} onChange={setC('budget', 'noWrong')} textarea />
              <StringList label="Loading captions" items={C.budget.loaderMessages} onChange={setC('budget', 'loaderMessages')} />
            </More>
          </>
        )

      case 'drinks':
        return (
          <>
            <Field label="Title" value={C.drinks.title} onChange={setC('drinks', 'title')} />
            <Field label="Subtitle" value={C.drinks.subtitle} onChange={setC('drinks', 'subtitle')} />
            <ObjectList
              label="Options (check “tease” to make one dodge)"
              items={C.drinks.options}
              onChange={setC('drinks', 'options')}
              columns={[{ key: 'label', label: 'Label (with emoji)' }, { key: 'tease', label: 'tease', type: 'checkbox' }]}
              makeEmpty={() => ({ id: nanoid(6), label: '', tease: false })}
            />
            <More>
              <StringList label="Tease dodge lines" items={C.drinks.teaseLines} onChange={setC('drinks', 'teaseLines')} />
              <StringList label="Loading captions" items={C.drinks.loaderMessages} onChange={setC('drinks', 'loaderMessages')} />
            </More>
          </>
        )

      case 'playlist':
        return (
          <>
            <Field label="Title" value={C.playlist.title} onChange={setC('playlist', 'title')} />
            <Field label="Subtitle" value={C.playlist.subtitle} onChange={setC('playlist', 'subtitle')} />
            <StringList label="Song suggestions" items={C.playlist.suggestions} onChange={setC('playlist', 'suggestions')} />
            <label className="ck">
              <input type="checkbox" checked={C.playlist.allowCustom} onChange={(e) => setC('playlist', 'allowCustom')(e.target.checked)} />
              Allow a custom “any other” song
            </label>
            {C.playlist.allowCustom && <Field label="Custom option label" value={C.playlist.customLabel} onChange={setC('playlist', 'customLabel')} />}
            <More>
              <StringList label="Loading captions" items={C.playlist.loaderMessages} onChange={setC('playlist', 'loaderMessages')} />
            </More>
          </>
        )

      case 'done':
        return (
          <>
            <Field label="Title" value={C.done.title} onChange={setC('done', 'title')} />
            <Field label="Subtitle" value={C.done.subtitle} onChange={setC('done', 'subtitle')} />
            <More>
              <Field label="Closing line" value={C.done.closing} onChange={setC('done', 'closing')} />
              <Field label="Confetti emojis" value={C.done.confetti} onChange={setC('done', 'confetti')} />
            </More>
          </>
        )

      case 'share':
        return (
          <div className="share-step">
            {!result ? (
              <>
                <p className="share-lead">
                  It’s built — one tap unlocks your link 💌
                </p>

                {/* Endowment / IKEA effect: let them admire what they made before
                    they're asked to pay — seeing it builds ownership + loss aversion. */}
                <button
                  type="button"
                  className="share-preview-card"
                  onClick={() => openPreview('landing')}
                >
                  <span className="spc-eye">👁</span>
                  <span className="spc-body">
                    <strong>See what you built</strong>
                    <span className="spc-meta">
                      {enabledPages.length} question{enabledPages.length === 1 ? '' : 's'}
                      {' · '}
                      {stickerFile ? 'custom sticker' : stickerUrl ? 'sticker from URL' : 'default sticker'}
                    </span>
                  </span>
                  <span className="spc-play">Preview ▸</span>
                </button>

                {/* Price reframe — the CEO's ₹9 nudge, right above the price. */}
                <img
                  className="share-ceo"
                  src="/ceos_message.png"
                  alt="9₹ can’t buy you a packet of chips but can get u a date"
                  loading="lazy"
                />

                {/* The one decision on this screen — big, singular, reassuring. */}
                <button className="b-go" onClick={payAndGenerate} disabled={generating}>
                  {generating ? (
                    'Working…'
                  ) : (
                    <>
                      <span className="b-go-main">Pay ₹9 &amp; get my link 💘</span>
                      <span className="b-go-sub">Instant link · one-time · secure checkout</span>
                    </>
                  )}
                </button>

                {/* Optional email — quiet, and below the decision so it adds no
                    friction before they commit. */}
                <label className="fld share-email">
                  <span className="fld-label">📧 Email their answers to me <em className="fld-opt">(optional)</em></span>
                  <input
                    type="email"
                    inputMode="email"
                    name="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="fld-hint">🔒 Private — your date never sees it. Skip it if you don’t need their answers by email.</span>
                </label>

                {/* Buried escape hatch for internal team use. */}
                <details className="b-code">
                  <summary>Have a team code?</summary>
                  <div className="b-code-row">
                    <input
                      type="text"
                      placeholder="Enter code"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      value={bypassCode}
                      onChange={(e) => setBypassCode(e.target.value)}
                    />
                    <button className="mini" onClick={redeemCode} disabled={generating}>
                      ENTER
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <div className="b-result">
                <div className="b-result-emoji">🎉</div>
                <p className="b-result-title">Your link is ready!</p>
                <div className="b-link">
                  <input readOnly value={result.link} onFocus={(e) => e.target.select()} />
                  <button className="mini" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy'}</button>
                </div>
                <div className="b-actions">
                  <a className="b-open" href={result.link} target="_blank" rel="noreferrer">Open it ↗</a>
                  <button className="b-again" onClick={() => { setResult(null); setStepIndex(0) }}>Make another</button>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const preview = <PreviewPane config={previewConfig} page={step.preview} />

  // Open the modal preview; `fromPage` null keeps the current step, a page id
  // (e.g. 'landing') starts the walkthrough there.
  const openPreview = (fromPage = null) => {
    setPreviewStart(fromPage)
    setMobilePreview(true)
  }
  const closePreview = () => {
    setMobilePreview(false)
    setPreviewStart(null)
  }
  const modalPreviewPage = previewStart || step.preview

  return (
    <main className="builder">
      <div className="b-shell">
        {/* Step rail */}
        <aside className="b-rail">
          <div className="b-brand"><span className="b-frog">🛠️</span> Say Yes No No</div>
          <button className="b-quick" onClick={quickCreate} disabled={generating}>
            ⚡ Quick create <span className="b-quick-sub">use defaults</span>
          </button>
          <ol className="b-steps">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  className={`b-step ${i === idx ? 'active' : ''} ${i < idx ? 'done' : ''} ${skippedIds.has(s.id) ? 'skipped' : ''}`}
                  onClick={() => setStepIndex(i)}
                >
                  <span className="b-step-dot">{i < idx ? '✓' : s.icon}</span>
                  <span className="b-step-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Current step */}
        <section className="b-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="b-progress"><div className="b-progress-fill" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>
          <header className="b-main-head">
            <span className="b-main-icon">{step.icon}</span>
            <div>
              <h1>{step.label}</h1>
              <p>Step {idx + 1} of {steps.length}</p>
            </div>
            <button className="b-mobile-preview" onClick={() => openPreview(null)}>👁 Preview</button>
          </header>

          <div className="b-step-card" key={step.id}>
            {isQuestion && (
              <div className={`b-skip-bar ${isSkipped ? 'skipped' : ''}`}>
                <span className="b-skip-note">
                  {isSkipped
                    ? '🚫 Skipped — your date won’t see this question.'
                    : '✓ Included in the flow.'}
                </span>
                <button className="b-skip-btn" onClick={() => togglePage(step.id)}>
                  {isSkipped ? 'Include it' : 'Skip this one'}
                </button>
              </div>
            )}
            <div className={isSkipped ? 'b-fields-off' : ''}>{renderStep()}</div>
          </div>

          {error && <p className="b-error">⚠️ {error}</p>}

          <footer className="b-nav">
            <button className="b-back" disabled={isFirst} onClick={goPrev}>← Back</button>
            {!isShare && <button className="b-next" onClick={goNext}>Next →</button>}
          </footer>
        </section>

        {/* Desktop live preview */}
        <aside className="b-preview">
          <div className="b-preview-label">Live preview</div>
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-screen">{preview}</div>
          </div>
        </aside>
      </div>

      {/* Mobile preview modal */}
      {mobilePreview && (
        <div className="pv-modal" onClick={closePreview}>
          <div className="pv-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="pv-close" onClick={closePreview}>✕ Close preview</button>
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <PreviewPane config={previewConfig} page={modalPreviewPage} />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
