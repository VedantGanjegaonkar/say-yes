import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute base URL for the home page's social-preview (Open Graph) tags.
// Set VITE_SITE_URL (e.g. https://sayyesnono.com) so shared links unfurl with an
// absolute og:image; if unset, %OG_BASE% collapses to a relative path. Per-link
// /f/:slug previews derive their host automatically in api/link-preview.js.
const OG_BASE = (process.env.VITE_SITE_URL || '').replace(/\/+$/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-og-base',
      transformIndexHtml(html) {
        return html.split('%OG_BASE%').join(OG_BASE)
      },
    },
  ],
})
