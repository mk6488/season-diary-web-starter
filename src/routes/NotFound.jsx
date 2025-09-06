import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound(){
  return (
    <div className="card">
      <h2>Page not found</h2>
      <p className="small">The page you are looking for doesn’t exist.</p>
      <p className="small"><Link to="/">← Back to Dashboard</Link></p>
    </div>
  )
}


