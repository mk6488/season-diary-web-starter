import React from 'react'
import { Link } from 'react-router-dom'
import { getTests } from '../data/useData'

export default function Tests(){
  const rows = getTests()
  return (
    <div className="card">
      <h2>Testing Log</h2>
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Date</th><th>Athlete</th><th>Test</th><th>Time</th><th>Split</th><th>Rate</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td className="mono">{r.date}</td>
              <td><Link to={`/athlete/${r.id}`}>{r.athlete}</Link></td>
              <td>{r.type}</td>
              <td className="mono">{r.time}</td>
              <td className="mono">{r.split}</td>
              <td className="mono">{r.rate ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}
