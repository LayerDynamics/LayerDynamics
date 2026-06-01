import { Outlet } from 'react-router-dom'
import Nav from './Nav'
import Loader from './Loader'

export default function Layout() {
  return (
    <>
      <Loader />
      <Nav />
      <Outlet />
    </>
  )
}
