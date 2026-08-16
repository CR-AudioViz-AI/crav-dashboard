// app/layout.tsx — server-rendered brand shell
// CR AudioViz AI · EIN: 39-3646201 · May 2026
import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  metadataBase: new URL('https://dashboard.craudiovizai.com'),
  // 2026-08-16: no canonical was declared, so any duplicate path —
  // trailing slash, query string, preview host — competed with itself.
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/favicon.png', sizes: '32x32' }, { url: '/icon-512.png', sizes: '512x512' }],
    apple: '/apple-touch-icon.png',
  },

  title: 'Javari Dashboard',
  description: 'Central command for all your Javari apps, analytics, and credits.',
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
  openGraph: { images: [{ url: '/og-image.png', width: 1200, height: 630 }], title: 'Javari Dashboard', description: 'Central command for all your Javari apps, analytics, and credits.', type: 'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 200 }}>
          <a href="https://craudiovizai.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <span>📊</span>
            <span style={{ color: '#6366f1' }}>Javari Dashboard</span>
            <span style={{ color: '#374151', fontSize: 11, marginLeft: 4 }}>· CR AudioViz AI · EIN 39-3646201</span>
          </a>
          <a href="https://craudiovizai.com/auth/signup" style={{ background: '#6366f1', color: '#000', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Sign In →
          </a>
        </div>
        {children}
        <footer style={{ background: '#050608', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px', textAlign: 'center' }}>
          <p style={{ color: '#1f2937', fontSize: 11, margin: 0, fontFamily: 'system-ui' }}>
            © 2026 CR AudioViz AI, LLC — EIN: 39-3646201 · Fort Myers, Florida · Your Story. Our Design. ·{' '}
            <a href="https://craudiovizai.com" style={{ color: '#374151', textDecoration: 'none' }}>craudiovizai.com</a>
            {' '}·{' '}
            <a href="https://craudiovizai.com/auth/signup" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>Sign Up Free</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
