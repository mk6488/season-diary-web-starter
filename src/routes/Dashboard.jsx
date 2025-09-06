import React from 'react'
import { Link } from 'react-router-dom'
import { getAthletes } from '../data/useData'
import { useFilters } from '../data/filters'

function FocusTag({focus}){
  const cls = focus.includes('Endurance') && !focus.includes('Technique') ? 'endurance'
           : focus.includes('Aerobic') ? 'aerobic'
           : focus.includes('Technique') && !focus.includes('+') ? 'technique'
           : focus.includes('Efficiency') ? 'efficiency'
           : focus.includes('Power') ? 'power' : ''
  return <span className={'tag '+cls}>{focus}</span>
}

export default function Dashboard(){
  const { focus, setFocus, query, setQuery, clear } = useFilters()
  const athletes = getAthletes()
  .slice() // don’t mutate original
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  .filter(a => (focus ? a.focus === focus : true))
  .filter(a => (query ? (a.name.toLowerCase().includes(query.toLowerCase()) || a.group.toLowerCase().includes(query.toLowerCase())) : true))
  return (
    <div className="grid">
      <div className="card">
        <h2>Overview</h2>
        <div className="kpis" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
          <div className="card" style={{margin:0,padding:12}}>
            <div className="small">Athletes</div>
            <div style={{fontSize:22,fontWeight:700}}>{athletes.length}</div>
          </div>
          <div className="card" style={{margin:0,padding:12}}>
            <div className="small">Focus groups</div>
            <div style={{fontSize:22,fontWeight:700}}>{new Set(getAthletes().map(a=>a.focus)).size}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
          <input placeholder="Filter by name/group" value={query} onChange={e=>setQuery(e.target.value)} />
          <button className={focus===''? 'tag active':'tag'} onClick={()=>setFocus('')}>All</button>
          {Array.from(new Set(getAthletes().map(a=>a.focus))).map(f=>(
            <button key={f} className={focus===f? 'tag active':'tag'} onClick={()=>setFocus(f)}>{f}</button>
          ))}
          {(focus || query) && <button className="tag" onClick={clear}>Clear</button>}
        </div>
      </div>
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
