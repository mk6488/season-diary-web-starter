import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import notesMd from '../../content/athlete-review-notes/Athlete_Review_Notes_Oct2025.md?raw'

function splitAthletes(md) {
  const lines = String(md).split(/\r?\n/)
  const sections = []
  let current = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^###\s+.*\*\*(.+?)\*\*/) // ### 🧭 Athlete: **Name**
    if (match) {
      if (current) sections.push(current)
      current = { name: match[1].trim(), content: [line] }
    } else if (current) {
      current.content.push(line)
    }
  }
  if (current) sections.push(current)
  // Remove any leading header or hr content before first athlete
  return sections.map(s => ({ name: s.name, md: s.content.join('\n') }))
}

export default function AthleteReviews(){
  const athletes = useMemo(() => splitAthletes(notesMd), [])

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Athlete Reviews</h2>
        <p className="small" style={{ margin:0 }}>October 2025 one-on-one summaries</p>
      </header>

      {athletes.length === 0 ? (
        <p className="small" style={{ marginTop:12 }}>No review notes found.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16, marginTop:12 }}>
          {athletes.map((a) => (
            <article key={a.name} className="card" style={{ padding:12 }}>
              <details>
                <summary style={{ cursor:'pointer', display:'flex', alignItems:'baseline', gap:8 }}>
                  <span className="expand-caret" aria-hidden="true">▾</span>
                  <strong>{a.name}</strong>
                </summary>
                <div className="markdown" style={{ marginTop:8 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.md}</ReactMarkdown>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}


