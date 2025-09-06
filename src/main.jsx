import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import React, { Suspense } from 'react'
import App from './routes/App.jsx'
const Dashboard = React.lazy(()=>import('./routes/Dashboard.jsx'))
const Athlete = React.lazy(()=>import('./routes/Athlete.jsx'))
const Tests = React.lazy(()=>import('./routes/Tests.jsx'))
const Themes = React.lazy(()=>import('./routes/Themes.jsx'))
const Plan = React.lazy(()=>import('./routes/Plan.jsx'))
const Data = React.lazy(()=>import('./routes/Data.jsx'))
const NotFound = React.lazy(()=>import('./routes/NotFound.jsx'))

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Suspense fallback={<div className="small">Loading…</div>}><Dashboard /></Suspense> },
      { path: 'athlete/:id', element: <Suspense fallback={<div className="small">Loading…</div>}><Athlete /></Suspense> },
      { path: 'tests', element: <Suspense fallback={<div className="small">Loading…</div>}><Tests /></Suspense> },
      { path: 'themes', element: <Suspense fallback={<div className="small">Loading…</div>}><Themes /></Suspense> },
      { path: 'plan', element: <Suspense fallback={<div className="small">Loading…</div>}><Plan /></Suspense> },
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
