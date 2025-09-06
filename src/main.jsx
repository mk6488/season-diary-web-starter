import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './routes/App.jsx'
import Dashboard from './routes/Dashboard.jsx'
import Athlete from './routes/Athlete.jsx'
import Tests from './routes/Tests.jsx'
import Themes from './routes/Themes.jsx'
import Plan from './routes/Plan.jsx'
import Data from './routes/Data.jsx'
import NotFound from './routes/NotFound.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'athlete/:id', element: <Athlete /> },
      { path: 'tests', element: <Tests /> },
      { path: 'themes', element: <Themes /> },
      { path: 'plan', element: <Plan /> },
      { path: 'data', element: <Data /> },
      { path: '*', element: <NotFound /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
