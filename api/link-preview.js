// Server-side social link previews.
//
// The app is a client-rendered SPA, so link-unfurling crawlers (WhatsApp,
// Instagram, Facebook, Twitter/X, iMessage, LinkedIn, Slack, Discord, Telegram…)
// — which don't run JavaScript — would otherwise only ever see index.html with
// no per-page Open Graph tags, and every shared link would unfurl as a bare URL.
//
// A User-Agent-conditional rewrite in vercel.json routes ONLY those crawlers
// here; real humans fall through to the static SPA and never pay this hop. We
// return a tiny HTML document carrying just the right preview card:
//
//   ?type=home            → the marketing card for the "/" landing page
//   ?type=link&slug=…     → a deliberately mysterious card for a shared
//                           /f/:slug crush-link — no spoilers, because the
//                           curiosity ("who? what?") is what earns the tap.
//
// Absolute og:image / og:url are derived from the request host, so this needs
// no configuration and is always correct on whatever domain it's deployed to.

const CARDS = {
  home: {
    title: "Build a date they'll actually say yes to",
    description:
      'No login · one link · pure charm. Design a playful little ask and send it as a single private link.',
    image: '/og-cover.png',
    theme: '#7c6bff',
  },
  link: {
    title: 'Someone has a question for you… 💌',
    description: 'Tap to find out 💕',
    image: '/og-link.png',
    theme: '#ff93c1',
  },
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

export default function handler(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const base = `${proto}://${host}`

  const type = req.query && req.query.type === 'home' ? 'home' : 'link'
  const card = CARDS[type]

  // Reconstruct the canonical PAGE url (not this function's path) so og:url
  // points at the real link the crawler was asked to preview.
  const slug = req.query && typeof req.query.slug === 'string' ? req.query.slug : ''
  const pageUrl = type === 'home' ? `${base}/` : `${base}/f/${encodeURIComponent(slug)}`
  const imageUrl = `${base}${card.image}`

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(card.title)}</title>
<meta name="description" content="${esc(card.description)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Say Yes No No" />
<meta property="og:title" content="${esc(card.title)}" />
<meta property="og:description" content="${esc(card.description)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta property="og:image" content="${esc(imageUrl)}" />
<meta property="og:image:secure_url" content="${esc(imageUrl)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="${esc(card.title)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(card.title)}" />
<meta name="twitter:description" content="${esc(card.description)}" />
<meta name="twitter:image" content="${esc(imageUrl)}" />
<meta name="theme-color" content="${card.theme}" />
</head>
<body>
<p>${esc(card.description)}</p>
<p><a href="${esc(pageUrl)}">Open on Say Yes No No</a></p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // The card is identical for every link, so let the CDN cache it hard.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800')
  res.status(200).send(html)
}
