import React from 'react'

export default function Themes(){
  return (
    <div className="grid">
      <div className="card">
        <h2>Current Focus Groups</h2>
        <ul>
          <li><strong>Endurance:</strong> Rocky, Aidan</li>
          <li><strong>Aerobic base:</strong> Zach, Henry B</li>
          <li><strong>Technique:</strong> Harry</li>
          <li><strong>Efficiency:</strong> Henry C</li>
          <li><strong>Power:</strong> Reuben</li>
          <li><strong>Technique + Endurance:</strong> Virgil</li>
          <li><strong>Balanced development:</strong> Henry T</li>
        </ul>
      </div>
      <div className="card">
        <h2>Notes</h2>
        <p className="small">Update this section after each testing cycle to reflect shifts in focus based on new data.</p>
      </div>
    </div>
  )
}
