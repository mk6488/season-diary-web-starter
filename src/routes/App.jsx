import React, { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import './styles.css'

export default function App() {
  const [open, setOpen] = useState(false)

  useEffect(() => { ensureRemote('2025') }, []);

  return (
    <div className="shell">
      {/* Top bar (mobile) */}
      <header className="topbar">
        <button
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >☰</button>
        <h1 className="brand">Season Diary</h1>
      </header>

      {/* Sidebar / Drawer */}
      <aside className={open ? 'sidebar open' : 'sidebar'} aria-hidden={!open}>
        <div className="sidebar-inner">
          <div className="sidebar-header" style={{display:'flex',alignItems:'center',gap:8}}>
            <h2>Season Diary</h2>
            <button className="close-btn" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
          </div>
          <nav onClick={()=>setOpen(false)}>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/tests">Testing Log</NavLink>
            <NavLink to="/themes">Focus & Themes</NavLink>
            <NavLink to="/plan">6-Week Plan</NavLink>
            <NavLink to="/data">Data</NavLink>
          </nav>
          <p className="small footnote">Tip: use the Data page to paste/upload JSON after each test day.</p>
        </div>
      </aside>

      {/* Overlay (mobile only) */}
      {open && <div className="overlay" onClick={()=>setOpen(false)} />}

      {/* Main content */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
