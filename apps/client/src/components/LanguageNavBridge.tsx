import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageNav } from '../stores/useLanguageNav'

/**
 * DOM-side bridge for the Languages level: a Canvas sibling (mounted in Landing,
 * inside the router) that turns an in-Canvas logo click into a route navigation.
 * The logo can't call `useNavigate` (no router context inside the R3F Canvas), so
 * it sets `pending` in `useLanguageNav`; this watches that and navigates to
 * /languages/:id, then clears the request so it fires exactly once. Renders nothing.
 */
export default function LanguageNavBridge() {
  const pending = useLanguageNav((s) => s.pending)
  const consume = useLanguageNav((s) => s.consume)
  const navigate = useNavigate()

  useEffect(() => {
    if (!pending) return
    navigate(`/languages/${pending}`)
    consume()
  }, [pending, navigate, consume])

  return null
}
