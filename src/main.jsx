import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import React, { Suspense } from 'react'
import App from './routes/App.jsx'
const Dashboard = React.lazy(()=>import('./routes/Dashboard.jsx'))
const Athlete = React.lazy(()=>import('./routes/Athlete.jsx'))
const Tests = React.lazy(()=>import('./routes/Tests.jsx'))
const Themes = React.lazy(()=>import('./routes/Themes.jsx'))
// const TopCrews = React.lazy(()=>import('./routes/TopCrews.jsx'))
const Data = React.lazy(()=>import('./routes/Data.jsx'))
const NotFound = React.lazy(()=>import('./routes/NotFound.jsx'))
const ErgSessions = React.lazy(()=>import('./routes/ErgSessions.jsx'))
const ErgUpload = React.lazy(()=>import('./routes/ErgUpload.jsx'))
const ErgReport = React.lazy(()=>import('./routes/ErgReport.jsx'))
const ErgReportUpload = React.lazy(()=>import('./routes/ErgReportUpload.jsx'))
const Admin = React.lazy(()=>import('./routes/Admin.jsx'))

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Suspense fallback={<div className="small">Loading…</div>}><Dashboard /></Suspense> },
      { path: 'athlete/:id', element: <Suspense fallback={<div className="small">Loading…</div>}><Athlete /></Suspense> },
      { path: 'tests', element: <Suspense fallback={<div className="small">Loading…</div>}><Tests /></Suspense> },
      { path: 'themes', element: <Suspense fallback={<div className="small">Loading…</div>}><Themes /></Suspense> },
      { path: 'erg-sessions', element: <Suspense fallback={<div className="small">Loading…</div>}><ErgSessions /></Suspense> },
      { path: 'erg-sessions/upload', element: <Suspense fallback={<div className="small">Loading…</div>}><ErgUpload /></Suspense> },
      { path: 'erg-reports/:date', element: <Suspense fallback={<div className="small">Loading…</div>}><ErgReport /></Suspense> },
      { path: 'erg-reports/upload', element: <Suspense fallback={<div className="small">Loading…</div>}><ErgReportUpload /></Suspense> },
      { path: 'admin', element: <Suspense fallback={<div className="small">Loading…</div>}><Admin /></Suspense> },
      // { path: 'plan', element: <Suspense fallback={<div className="small">Loading…</div>}><TopCrews /></Suspense> },
      { path: 'data', element: <Suspense fallback={<div className="small">Loading…</div>}><Data /></Suspense> },
      { path: '*', element: <Suspense fallback={<div className="small">Loading…</div>}><NotFound /></Suspense> },
    ]
  }
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)

// register SW for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{})
  })
}
