import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAthlete } from '../data/useData'
import { parseTimeToSeconds, formatDeltaSeconds } from '../data/time'

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
            <thead><tr><th>Date</th><th>Test</th><th>Time</th><th>Δ vs prev (same test)</th><th>Split</th><th>Rate</th></tr></thead>
            <tbody>
              {a.tests.map((t,i)=>{
                // find previous entry of the same test type for this athlete
                const prev = a.tests.slice(i+1).find(x => x.type === t.type);
                const currSec = parseTimeToSeconds(t.time);
                const prevSec = parseTimeToSeconds(prev?.time);
                const delta = Number.isFinite(currSec) && Number.isFinite(prevSec) ? currSec - prevSec : NaN;
                // PR logic per test type: first occurrence is PR; later PR if faster than any previous of same type
                const priorSame = a.tests.slice(i+1).filter(x => x.type === t.type);
                let isPr = false;
                if (Number.isFinite(currSec)){
                  if (priorSame.length === 0) {
                    isPr = true;
                  } else {
                    const bestPrev = priorSame.reduce((best, x)=>{
                      const s = parseTimeToSeconds(x.time);
                      return Number.isFinite(s) ? Math.min(best, s) : best;
                    }, Infinity);
                    isPr = Number.isFinite(bestPrev) && currSec < bestPrev;
                  }
                }
                return (
                  <tr key={`${a.id}-${t.date}-${t.type}`} className={isPr ? 'pr' : ''}>
                    <td className="mono">{t.date}</td>
                    <td>{t.type}</td>
                    <td className="mono">{t.time}{isPr && <span className="tag" style={{marginLeft:6}}>PR</span>}</td>
                    <td className="mono" style={{color: Number.isFinite(delta) ? (delta<0?'#059669':delta>0?'#b91c1c':'inherit'):'inherit'}}>
                      {Number.isFinite(delta) ? (delta<0? '−' : '+') + formatDeltaSeconds(delta) : '-'}
                    </td>
                    <td className="mono">{t.split}</td>
                    <td className="mono">{t.rate ?? '-'}</td>
                  </tr>
                )
              })}
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
        <div style={{marginTop:12}}>
          <button onClick={()=>window.print()}>Print report</button>
        </div>
      </div>
    </div>
  )
}
