import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ensureRemote } from '../data/useData';
import { CURRENT_SEASON_ID } from '../data/constants';
import './styles.css';
import { FiltersProvider } from '../data/filters.jsx';
import { fetchErgReports } from '../data/remote';
import CommandPalette from '../components/CommandPalette.jsx';

// in App.jsx
function readSyncInfo(){
  const atRaw = sessionStorage.getItem('seasonDiaryLastRemoteAt');
  return atRaw
    ? { source: 'cloud', at: Number(atRaw) }
    : { source: 'local', at: null };
}


export default function App() {
  const [open, setOpen] = useState(false);
  const [syncInfo, setSyncInfo] = useState(readSyncInfo());
  const [toast, setToast] = useState('');
  const location = useLocation();
  const [reportCount, setReportCount] = useState(0);

  // Fetch central data once; when done, trigger a re-render so views read fresh data
  useEffect(() => {
    (async () => { await ensureRemote(CURRENT_SEASON_ID); setSyncInfo(readSyncInfo()); })();
  }, []);

  // Load report count to show nav indicator
  useEffect(() => {
    let active = true;
    (async () => {
      try{
        const rows = await fetchErgReports(CURRENT_SEASON_ID);
        if (active) setReportCount(Array.isArray(rows) ? rows.length : 0);
      }catch{ if (active) setReportCount(0); }
    })();
    return () => { active = false; };
  }, []);

  // Close drawer when route changes
  useEffect(() => { setOpen(false); }, [location]);

  // Update sync badge when the tab regains focus
  useEffect(() => {
    const onFocus = () => setSyncInfo(readSyncInfo());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Toast: after a reload triggered by cloud data change
  useEffect(() => {
    const key = 'seasonDiaryShowToast';
    if (sessionStorage.getItem(key)) {
      setToast('Cloud data updated. You are viewing the latest.');
      sessionStorage.removeItem(key);
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, []);

  // A11y: focus trap, ESC to close, and hide background from AT while open
  useEffect(() => {
    if (!open) return;
    const drawer = document.getElementById('site-drawer');
    if (!drawer) return;

    // Move focus into the drawer
    const focusables = drawer.querySelectorAll(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    (first || drawer).focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'Tab' && focusables.length) {
        // simple focus trap
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    // Hide background
    const main = document.querySelector('main.main');
    if (main) {
      main.setAttribute('inert', '');
      main.setAttribute('aria-hidden', 'true');
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (main) {
        main.removeAttribute('inert');
        main.removeAttribute('aria-hidden');
      }
      const trigger = document.querySelector('.menu-btn');
      trigger && trigger.focus && trigger.focus();
    };
  }, [open]);

  const syncLabel =
    syncInfo.source === 'cloud'
      ? `Cloud sync ✓${syncInfo.at ? ' • ' + new Date(syncInfo.at).toLocaleString() : ''}`
      : 'Local data';

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Top bar (mobile) */}
      <header className="topbar">
        <button
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="site-drawer"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <h1 className="brand">Season Diary</h1>
      </header>

      {/* Sidebar / Drawer */}
      <aside
        id="site-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={open ? 'sidebar open' : 'sidebar'}
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="sidebar-inner">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 id="drawer-title">Season Diary</h2>
            <button className="close-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <nav onClick={() => setOpen(false)}>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/tests">Testing Log</NavLink>
            <NavLink to="/themes">Focus & Themes</NavLink>
            <NavLink to="/erg-sessions">Erg Sessions {reportCount>0 && (<span className="badge" aria-label={`${reportCount} reports available`} title={`${reportCount} reports available`}>{reportCount}</span>)}</NavLink>
            <NavLink to="/plan">Top Crews</NavLink>
            <NavLink to="/data">Data</NavLink>
          </nav>

          <p className="small footnote">{syncLabel}</p>
        </div>
      </aside>

      {/* Overlay (mobile only) */}
      {open && <div className="overlay" aria-hidden="true" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <main id="main" className="main">
        {toast && (
          <div className="toast" role="status" aria-live="polite">{toast}</div>
        )}
        <FiltersProvider>
          <CommandPalette />
          <Outlet />
        </FiltersProvider>
      </main>
    </div>
  );
}
