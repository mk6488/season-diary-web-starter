import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchErgReportByDate } from '../data/remote'
import { CURRENT_SEASON_ID } from '../data/constants'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ErgReport(){
  const { date } = useParams()
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  useEffect(() => {
    let active = true
    fetchErgReportByDate(CURRENT_SEASON_ID, date)
      .then((r) => { if (active) setReport(r) })
      .catch(() => { if (active) setError('Report not found') })
    return () => { active = false }
  }, [date])

  if (error) return <section className="card"><p className="small">{error}</p></section>
  if (!report) return <section className="card"><p className="small">Loading…</p></section>

  const title = (report.title || String(report.markdown || '').split(/\r?\n/)[0]).replace(/^#\s*/, '')

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
        <h2 style={{ margin:0 }}>{title}</h2>
        <span className="small">{date}</span>
      </header>
      <div className="markdown" style={{ marginTop: 8 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(report.markdown || '')}</ReactMarkdown>
      </div>
    </section>
  )
}


