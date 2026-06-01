import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './routes/Landing'
import ProjectDetail from './routes/ProjectDetail'
import { HireMe } from './components/HireMe'
import './App.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'hire', element: <HireMe /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
