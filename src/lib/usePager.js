import { useEffect, useRef } from 'react'

/**
 * Live, finger-following horizontal pager.
 *
 * - Follows the touch with translate as long as the user is in x-dominant gesture.
 * - Commits (calls onLeft/onRight) when released past `commitAt` px.
 * - Springs back otherwise.
 * - Falls through to vertical scrolling on y-dominant gestures.
 * - Hard no-op when html[data-motion="reduced"] is set — only the commit fires.
 */
export function usePager(ref, { onLeft, onRight, commitAt = 80, maxDrag = 160 } = {}) {
  const state = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function reducedMotion() {
      return document.documentElement.getAttribute('data-motion') === 'reduced'
    }

    function onStart(e) {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      state.current = {
        x: t.clientX, y: t.clientY,
        axis: null,
        dx: 0, dy: 0,
        startedAt: Date.now(),
        reduced: reducedMotion(),
      }
    }

    function onMove(e) {
      const s = state.current
      if (!s) return
      const t = e.touches[0]
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y
      if (!s.axis) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        }
      }
      s.dx = dx
      s.dy = dy
      if (s.axis === 'x' && !s.reduced) {
        // Live follow with mild resistance past maxDrag
        const drag = Math.sign(dx) * Math.min(Math.abs(dx), maxDrag + Math.abs(dx - Math.sign(dx) * maxDrag) * 0.15)
        el.style.transition = 'none'
        el.style.transform = `translateX(${drag}px)`
        el.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, 0.18))
      }
    }

    function onEnd() {
      const s = state.current
      state.current = null
      if (!s) return
      if (s.axis !== 'x') return
      const dx = s.dx
      const dt = Math.max(1, Date.now() - s.startedAt)
      const speed = Math.abs(dx) / dt
      const fastEnough = speed > 0.5 && Math.abs(dx) > 24

      el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s'
      if (!s.reduced && (Math.abs(dx) > commitAt || fastEnough)) {
        // Commit
        const dir = dx < 0 ? 'left' : 'right'
        el.style.transform = `translateX(${dir === 'left' ? -window.innerWidth * 0.5 : window.innerWidth * 0.5}px)`
        el.style.opacity = '0'
        setTimeout(() => {
          if (dir === 'left') onLeft?.()
          else onRight?.()
        }, 140)
      } else {
        // Spring back
        el.style.transform = ''
        el.style.opacity = ''
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, onLeft, onRight, commitAt, maxDrag])
}
