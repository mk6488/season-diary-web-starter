import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import './styles.css'

export default function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Season Diary</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/tests">Testing Log</NavLink>
          <NavLink to="/themes">Focus & Themes</NavLink>
          <NavLink to="/plan">6-Week Plan</NavLink>
          <NavLink to="/data">Data</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
