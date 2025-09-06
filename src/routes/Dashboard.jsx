import React from 'react'
import { Link } from 'react-router-dom'
import { getAthletes } from '../data/useData'

function FocusTag({focus}){
  const cls = focus.includes('Endurance') && !focus.includes('Technique') ? 'endurance'
           : focus.includes('Aerobic') ? 'aerobic'
           : focus.includes('Technique') && !focus.includes('+') ? 'technique'
           : focus.includes('Efficiency') ? 'efficiency'
           : focus.includes('Power') ? 'power' : ''
  return <span className={'tag '+cls}>{focus}</span>
}

export default function Dashboard(){
  const athletes = getAthletes()
  return (
    <div className="grid">
      <div className="card">
        <h2>Squad Overview</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Athlete</th><th>Group</th><th>Experience</th><th>Focus</th></tr></thead>
          <tbody>
            {athletes.map(a=>(
              <tr key={a.id}>
                <td><Link to={`/athlete/${a.id}`}>{a.name}</Link></td>
                <td>{a.group}</td>
                <td>{a.experience}</td>
                <td><FocusTag focus={a.focus} /></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div className="card">
        <h2>How to use</h2>
        <p className="small">Use this dashboard to navigate to athlete profiles, view the testing log, and reference current training themes and plans.</p>
      </div>
    </div>
  )
}
