import React, { useMemo, useState } from 'react'

// Vite glob import: load all .md files placed under /src/erg-sessions/
// We also try to include the project-root erg_session.md via an explicit import with ?raw
// Authors: put future files in /src/erg-sessions/YYYY-MM-DD-erg.md (or any name)

// All markdown under src/erg-sessions
const sessionModules = import.meta.glob('../erg-sessions/**/*.md', { as: 'raw', eager: true })

// Optional: include the root-level example if present at build time
let rootErg = null
try {
  // @ts-ignore - vite query import
  rootErg = await import('../../erg_session.md?raw')
} catch (_) {
  rootErg = null
}

function extractDateFromMarkdown(md) {
  // Expect first line like: "# Erg Session – Tuesday, 9th September 2025"
  // We'll find the first line that starts with '#', then parse the date part after '– '
  const lines = md.split(/\r?\n/)
  const h1 = lines.find((l) => l.startsWith('#')) || ''
  // Try to pull the trailing date portion by removing known prefix
  // Fallback: try Date.parse on anything after the last comma or last space
  let dateStr = h1.replace(/^#\s*Erg Session\s*\u2013\s*/i, '').trim()
  // If replacement didn't change (no dash found), try after last ' - ' or '–'
  if (dateStr === h1.trim()) {
    const parts = h1.split('–')
    if (parts.length > 1) dateStr = parts[1].trim()
  }
  // Normalize common ordinal suffixes (1st, 2nd, 3rd, 4th)
  dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1')
  // Some headings may include weekday, keep it; Date should handle it
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? null : parsed
}

function useSessions() {
  const [error, setError] = useState('')
  const sessions = useMemo(() => {
    try {
      const list = []
      // Add root example first if present
      if (rootErg && typeof rootErg.default === 'string') {
        list.push({ id: 'root-erg-session', md: rootErg.default })
      }
      Object.entries(sessionModules).forEach(([path, md]) => {
        if (/ERG_SESSION_TEMPLATE\.md$/i.test(path)) return
        list.push({ id: path, md })
      })
      // Map to objects with date
      const withDates = list.map((item) => {
        const date = extractDateFromMarkdown(item.md)
        return { ...item, date }
      })
      // Filter those we can parse a date for
      const valid = withDates.filter((s) => s.date instanceof Date)
      // Sort by date desc (latest first)
      valid.sort((a, b) => b.date.getTime() - a.date.getTime())
      return valid
    } catch (e) {
      setError('Failed to load erg sessions')
      return []
    }
  }, [])

  return { sessions, error }
}

export default function ErgSessions() {
  const { sessions, error } = useSessions()

  return (
    <section className="card">
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Erg Sessions</h2>
        <p className="small">Latest first</p>
      </header>

      {error && <p className="small" role="alert">{error}</p>}

      {sessions.length === 0 ? (
        <p className="small">No erg sessions found yet. Add .md files under <code>src/erg-sessions/</code>.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
          {sessions.map((s) => (
            <article key={s.id} className="card" style={{ padding: 12 }}>
              <details>
                <summary style={{ cursor: 'pointer' }}>
                  <strong>
                    {s.md.split(/\r?\n/)[0].replace(/^#\s*/, '')}
                  </strong>
                  {s.date && (
                    <span className="small" style={{ marginLeft: 8 }}>
                      {s.date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </summary>
                <pre className="mono" style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{s.md}</pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}


