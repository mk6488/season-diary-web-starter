import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ensureRemote } from '../data/useData';
import './styles.css';

// in App.jsx
function readSyncInfo(){
  const atRaw = sessionStorage.getItem('seasonDiaryLastRemoteAt');
  return atRaw ? `Cloud sync ✓ • ${new Date(Number(atRaw)).toLocaleString()}` : 'Cloud data';
}


export default function App() {
  const [open, setOpen] = useState(false);
  const [syncInfo, setSyncInfo] = useState(readSyncInfo());
  const location = useLocation();

  // Fetch central data once; ensureRemote reloads the page only if data changed
  useEffect(() => { ensureRemote('2025'); }, []);

  // Close drawer when route changes
  useEffect(() => { setOpen(false); }, [location]);

  // Update sync badge when the tab regains focus
  useEffect(() => {
    const onFocus = () => setSyncInfo(readSyncInfo());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const syncLabel =
    syncInfo.source === 'cloud'
      ? `Cloud sync ✓${syncInfo.at ? ' • ' + new Date(syncInfo.at).toLocaleString() : ''}`
      : 'Local data';

  return (
    <div className="shell">
      {/* Top bar (mobile) */}
      <header className="topbar">
        <button
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <h1 className="brand">Season Diary</h1>
      </header>

      {/* Sidebar / Drawer */}
      <aside className={open ? 'sidebar open' : 'sidebar'} aria-hidden={!open}>
        <div className="sidebar-inner">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2>Season Diary</h2>
            <button className="close-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <nav onClick={() => setOpen(false)}>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/tests">Testing Log</NavLink>
            <NavLink to="/themes">Focus & Themes</NavLink>
            <NavLink to="/plan">6-Week Plan</NavLink>
            <NavLink to="/data">Data</NavLink>
          </nav>

          <p className="small footnote">{syncLabel}</p>
        </div>
      </aside>

      {/* Overlay (mobile only) */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
