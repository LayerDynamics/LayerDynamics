import { useEffect, useRef, useState } from 'react'

/**
 * IntersectionObserver-backed reveal hook (Hamish portfolio pattern). Attach the
 * returned `ref` to a DOM element; `visible` flips true the first time the
 * element enters the viewport (with a small early margin) and stays true.
 */
export function useInViewport<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '0px 0px -10% 0px',
) {
  const ref = useRef<T>(null)
  // When IntersectionObserver is unavailable (SSR/old engines), start visible so
  // content is never hidden — and the effect never needs a synchronous setState.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, visible }
}
