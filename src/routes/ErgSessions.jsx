import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchErgSessions, fetchErgReports } from '../data/remote'
import { CURRENT_SEASON_ID } from '../data/constants'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Vite glob import: load all .md files placed under /src/erg-sessions/
// We also try to include the project-root erg_session.md via an explicit import with ?raw
// Authors: put future files in /src/erg-sessions/YYYY-MM-DD-erg.md (or any name)

// All markdown under src/erg-sessions (Vite v5: use query/import instead of deprecated "as")
// Local hardcoded markdown fallback is disabled for testing Firestore uploads

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
  const [cloud, setCloud] = useState(null)
  const [reports, setReports] = useState([])

  useEffect(() => {
    let active = true
    fetchErgSessions(CURRENT_SEASON_ID)
      .then((rows) => { if (active) setCloud(Array.isArray(rows) ? rows : []) })
      .catch(() => { if (active) setCloud([]) })
    fetchErgReports(CURRENT_SEASON_ID)
      .then((rows) => { if (active) setReports(Array.isArray(rows) ? rows : []) })
      .catch(() => { if (active) setReports([]) })
    return () => { active = false }
  }, [])
  const sessions = useMemo(() => {
    try {
      // Cloud-only mode
      if (Array.isArray(cloud) && cloud.length) {
        const mapped = cloud.map((c) => {
          const date = typeof c.date === 'string' ? new Date(c.date) : (c.date?.toDate ? c.date.toDate() : null)
          return {
            id: c.id,
            md: String(c.markdown || ''),
            date: date && !isNaN(date?.getTime?.()) ? date : extractDateFromMarkdown(String(c.markdown || '')),
            title: c.title || (String(c.markdown || '').split(/\r?\n/)[0].replace(/^#\s*/, '')),
          }
        })
        const valid = mapped.filter((s) => s.date instanceof Date)
        valid.sort((a, b) => b.date.getTime() - a.date.getTime())
        return valid
      }
      return []
    } catch (e) {
      setError('Failed to load erg sessions')
      return []
    }
  }, [cloud])

  const reportByDate = useMemo(() => {
    const map = new Map()
    for (const r of reports) {
      if (r?.date) map.set(String(r.date), r)
    }
    return map
  }, [reports])

  return { sessions, error, reportByDate }
}

export default function ErgSessions() {
  const { sessions, error, reportByDate } = useSessions()
  const [printingId, setPrintingId] = useState(null)
  const detailRefs = useRef({})

  const handlePrint = (id) => {
    const detailsEl = detailRefs.current[id]
    const wasOpen = detailsEl ? detailsEl.open : false
    if (detailsEl) detailsEl.open = true
    setPrintingId(id)
    const onAfter = () => {
      setPrintingId(null)
      if (detailsEl) detailsEl.open = wasOpen
      window.removeEventListener('afterprint', onAfter)
    }
    window.addEventListener('afterprint', onAfter)
    setTimeout(() => window.print(), 50)
  }

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
            <article key={s.id} className={"card session-card" + (printingId === s.id ? ' printing' : '')} style={{ padding: 12 }}>
              <details ref={(el) => { if (el) detailRefs.current[s.id] = el }}>
                <summary style={{ cursor:'pointer' }}>
                  <strong>{s.title || s.md.split(/\r?\n/)[0].replace(/^#\s*/, '')}</strong>
                  {s.date && (
                    <span className="small" style={{ marginLeft:8 }}>
                      {s.date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {reportByDate.has(s.date?.toISOString().slice(0,10)) && (
                    <span className="tag report" style={{ marginLeft:8 }}>Report uploaded</span>
                  )}
                </summary>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginTop:8 }}>
                  {reportByDate.has(s.date?.toISOString().slice(0,10)) && (
                    <a className="chip" href={`/erg-reports/${s.date.toISOString().slice(0,10)}`}>View report</a>
                  )}
                  {!reportByDate.has(s.date?.toISOString().slice(0,10)) && (
                    <a className="chip" href={`/erg-reports/${s.date.toISOString().slice(0,10)}`}>View report (example)</a>
                  )}
                  <div style={{ marginLeft:'auto' }}>
                    <button className="chip print-btn" onClick={() => handlePrint(s.id)}>Print</button>
                  </div>
                </div>
                <div className="markdown" style={{ marginTop: 8 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.md}</ReactMarkdown>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}


