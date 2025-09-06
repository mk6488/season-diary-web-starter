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
    .map(([label, names]) => ({ label, names: names.slice().sort((a,b)=>a.localeCompare(b)) }))
    .sort((a,b)=> a.label.localeCompare(b.label));

  return (
    <div className="grid">
      <div className="card">
        <h2>Current Focus Groups</h2>
        {groups.length === 0 ? (
          <p className="small">No athletes available.</p>
        ) : (
          <ul>
            {groups.map(g => (
              <li key={g.label}><strong>{g.label}:</strong> {g.names.join(', ')}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h2>Notes</h2>
        <p className="small">Update this section after each testing cycle to reflect shifts in focus based on new data.</p>
      </div>
    </div>
  )
}
