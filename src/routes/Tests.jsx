import React from 'react'
import { Link } from 'react-router-dom'
import { getTests } from '../data/useData'
import { useFilters } from '../data/filters'

export default function Tests(){
  const { focus } = useFilters()
  const rows = getTests().filter(r => (focus ? r.type.includes('') || r.focus === focus : true))
  return (
    <div className="card">
      <h2>Testing Log</h2>
      <div className="table-wrap"><table className="table">
        <thead style={{position:'sticky',top:0,background:'var(--panel)'}}><tr><th>Date</th><th>Athlete</th><th>Test</th><th>Time</th><th>Split</th><th>Rate</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={`${r.id}-${r.date}-${r.type}`}>
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
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button onClick={()=>downloadCsv(rows)} className="tag">Export CSV</button>
      </div>
    </div>
  )
}

function downloadCsv(rows){
  const header = ['date','athlete','id','type','time','split','rate']
  const csv = [header.join(',')].concat(
    rows.map(r=> header.map(k=>escapeCsv(r[k] ?? '')).join(','))
  ).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'tests.csv'; a.click();
  URL.revokeObjectURL(url)
}
function escapeCsv(val){
  const s = String(val)
  return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s
}
