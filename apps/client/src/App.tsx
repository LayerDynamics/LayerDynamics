import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './routes/Landing'
import ProjectDetail from './routes/ProjectDetail'
import LanguageProjects from './routes/LanguageProjects'
import './App.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'languages/:lang', element: <LanguageProjects /> },
      // The Hire-Me form now lives on the landing's contact level (HireMeOverlay),
      // not a standalone page. Any stale /hire link falls through to the catch-all.
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
