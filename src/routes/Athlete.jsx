import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAthlete } from '../data/useData'

export default function Athlete(){
  const { id } = useParams()
  const a = getAthlete(id)
  if(!a){ return <div className="card">Athlete not found.</div> }

  return (
    <div className="grid">
      <div className="card">
        <h2>{a.name} <span className="small">({a.group}, {a.experience})</span></h2>
        <p>Focus: <span className="tag">{a.focus}</span></p>
      </div>

      <div className="card">
        <h3>Testing History</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Test</th><th>Time</th><th>Split</th><th>Rate</th></tr></thead>
            <tbody>
              {a.tests.map((t,i)=>(
                <tr key={`${a.id}-${t.date}-${t.type}`}>
                  <td className="mono">{t.date}</td>
                  <td>{t.type}</td>
                  <td className="mono">{t.time}</td>
                  <td className="mono">{t.split}</td>
                  <td className="mono">{t.rate ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small"><Link to="/">← Back to Dashboard</Link></p>
      </div>

      {/* NEW: coach analysis */}
      <div className="card">
        <h3>Coach Analysis</h3>
        {a.coachNote
          ? a.coachNote.split('\n').map((line,i)=> <p key={i}>{line.trim()}</p>)
          : <p className="small">No notes yet.</p>}
      </div>
    </div>
  )
}
