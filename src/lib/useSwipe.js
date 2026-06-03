import { useEffect, useRef } from 'react'

/**
 * Attach swipe gesture handlers to an element ref.
 * Returns helpers; threshold = min px of dominant axis to fire.
 */
export function useSwipe(ref, { onLeft, onRight, onDown, onUp, threshold = 60, edgeOnly = false } = {}) {
  const state = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onStart(e) {
      const t = e.touches[0]
      if (edgeOnly && t.clientX > 24 && t.clientX < window.innerWidth - 24) {
        state.current = null
        return
      }
      state.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: false, axis: null }
    }
    function onMove(e) {
      if (!state.current) return
      const t = e.touches[0]
      const dx = t.clientX - state.current.x
      const dy = t.clientY - state.current.y
      if (!state.current.axis) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          state.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        }
      }
      state.current.dx = dx
      state.current.dy = dy
    }
    function onEnd() {
      const s = state.current
      state.current = null
      if (!s || !s.axis) return
      const elapsed = Date.now() - s.t
      if (elapsed > 600) return
      if (s.axis === 'x') {
        if (s.dx <= -threshold) onLeft?.()
        else if (s.dx >= threshold) onRight?.()
      } else {
        if (s.dy >= threshold) onDown?.()
        else if (s.dy <= -threshold) onUp?.()
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
  }, [ref, onLeft, onRight, onDown, onUp, threshold, edgeOnly])
}

/**
 * Detach swipe with live drag offset reporting (for sheet dismissal).
 * Calls onDrag(dy) while dragging downward; calls onRelease(commit:boolean).
 */
export function useDragDownToDismiss(ref, { onDrag, onRelease } = {}) {
  const state = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function start(e) {
      const t = e.touches[0]
      const target = e.target
      const onHandle = !!(target.closest && target.closest('[data-sheet-handle]'))
      state.current = {
        y: t.clientY,
        dy: 0,
        dragging: false,
        onHandle,
        startScrollTop: el.scrollTop,
        cancelled: false,
      }
    }
    function move(e) {
      const s = state.current
      if (!s || s.cancelled) return
      const t = e.touches[0]
      const dy = t.clientY - s.y

      // Body touches: if the sheet is scrolled away from the top,
      // this is a scroll gesture — never a dismiss. Cancel for good.
      if (!s.onHandle && el.scrollTop > 0) {
        s.cancelled = true
        return
      }
      // Body touches at scrollTop=0 also need the first motion to be
      // clearly downward. If user swipes up (intending to scroll content
      // further), abandon the drag intent.
      if (!s.onHandle && dy < -4) {
        s.cancelled = true
        return
      }

      if (dy < 0) return

      // Hysteresis: handle starts at 8px, body needs 14px (more deliberate).
      const activate = s.onHandle ? 8 : 14
      if (!s.dragging && dy > activate) s.dragging = true

      if (s.dragging) {
        s.dy = dy
        onDrag?.(dy)
      }
    }
    function end() {
      const s = state.current
      state.current = null
      if (!s || !s.dragging) return
      onRelease?.(s.dy || 0)
    }

    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [ref, onDrag, onRelease])
}
