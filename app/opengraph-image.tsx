import { ImageResponse } from 'next/og';

/**
 * Site-wide Open Graph image, rendered as a real PNG (1200x630) at request
 * time. This fixes the WhatsApp/Instagram link-preview problem: scrapers
 * ignore SVG images (the old /favicon.svg), so links showed a generic icon.
 * PNG is universally supported by WhatsApp, Instagram, Twitter, LinkedIn, etc.
 */

export const alt = 'Studious Harshita — free & premium study notes for students';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF6EF',
          backgroundImage:
            'linear-gradient(135deg, rgba(47,93,80,0.06) 0%, rgba(233,160,166,0.08) 50%, rgba(229,192,123,0.10) 100%)',
          padding: '64px',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 28px',
            borderRadius: 999,
            border: '2px solid #2F5D50',
            color: '#2F5D50',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          ✷ Study smarter, for free
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 108,
            fontWeight: 700,
            color: '#1A1A1A',
            letterSpacing: -2,
          }}
        >
          <span>studious</span>
          <span style={{ color: '#2F5D50', fontStyle: 'italic' }}>harshita</span>
          <span style={{ color: '#2F5D50' }}>.</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 36,
            color: '#4A443B',
          }}
        >
          Free &amp; premium study notes, planners &amp; AI tools for students
        </div>

        {/* Domain strip */}
        <div
          style={{
            display: 'flex',
            marginTop: 56,
            padding: '14px 36px',
            borderRadius: 16,
            backgroundColor: '#1A1A1A',
            color: '#FAF6EF',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          resources.studiousharshita.com
        </div>
      </div>
    ),
    { ...size }
  );
}
