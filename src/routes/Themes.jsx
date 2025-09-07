import React from 'react'
import { getAthletes } from '../data/useData'

export default function Themes(){
  const athletes = getAthletes() || [];
  const byFocus = new Map();
  for(const a of athletes){
    const label = a.focus || 'Unassigned';
    if(!byFocus.has(label)) byFocus.set(label, []);
    byFocus.get(label).push(a.name);
  }
  const groups = Array.from(byFocus.entries())
    .map(([label, names]) => ({ label, count: names.length, names: names.slice().sort((a,b)=>a.localeCompare(b)) }))
    .sort((a,b)=> a.label.localeCompare(b.label));

  return (
    <div className="grid">
      <div className="card">
        <h2>Focus & Themes</h2>
        {groups.length === 0 ? (
          <p className="small">No athletes available.</p>
        ) : (
          <div className="themes-grid">
            {groups.map(g => (
              <div key={g.label} className={`theme theme-${slug(g.label)}`}>
                <div className="theme-head">
                  <h3>{g.label}</h3>
                  <span className="badge">{g.count}</span>
                </div>
                <div className="chips">
                  {g.names.map(n => <span key={n} className="chip">{n}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h2>Notes</h2>
        <p className="small">Update this section after each testing cycle to reflect shifts in focus based on new data.</p>
      </div>
    </div>
  )
}

function slug(s){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
