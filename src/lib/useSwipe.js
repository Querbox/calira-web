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
      // Only initiate the dismiss gesture when the touch begins on a
      // designated handle (grabber / header). Scrolling within the body
      // therefore never triggers dismiss — even when scrollTop hits 0.
      const handle = target.closest && target.closest('[data-sheet-handle]')
      if (!handle) return
      state.current = { y: t.clientY, dragging: false, dy: 0 }
    }
    function move(e) {
      if (!state.current) return
      const t = e.touches[0]
      const dy = t.clientY - state.current.y
      if (dy < 0) return
      if (!state.current.dragging && dy > 8) state.current.dragging = true
      if (state.current.dragging) {
        state.current.dy = dy
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
