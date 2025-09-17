import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ErgReport(){
  const { date } = useParams()
  const [error, setError] = useState('')

  // Local example reports bundled at build time
  const localReports = useMemo(() => {
    const modules = import.meta.glob('../../content/erg-sessions/erg_session_reports_*.md', { query: '?raw', import: 'default', eager: true })
    const map = new Map()
    Object.entries(modules).forEach(([path, md]) => {
      const m = path.match(/erg_session_reports_(\d{4})_(\d{2})_(\d{2})\.md$/)
      if (m) {
        const key = `${m[1]}-${m[2]}-${m[3]}` // YYYY-MM-DD
        map.set(key, String(md))
      }
    })
    return map
  }, [])

  const markdown = localReports.get(date)

  useEffect(() => {
    if (!markdown) setError('Report not found')
    else setError('')
  }, [markdown])

  if (error) return <section className="card"><p className="small">{error}</p></section>
  if (!markdown) return <section className="card"><p className="small">Loading…</p></section>

  const title = String(markdown || '').split(/\r?\n/)[0].replace(/^#\s*/, '')

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
        <h2 style={{ margin:0 }}>{title}</h2>
        <span className="small">{date}</span>
      </header>
      <div className="markdown" style={{ marginTop: 8 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(markdown || '')}</ReactMarkdown>
      </div>
    </section>
  )
}


