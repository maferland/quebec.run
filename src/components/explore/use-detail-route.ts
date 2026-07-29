'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PANEL_ENTER_MS, PANEL_EXIT_MS } from './detail-panel'
import { detailKey, type DetailRoute } from './explore-route'

export type CloseMode = 'history' | 'route'

export type DetailOverlayState = DetailRoute & {
  exiting: boolean
  enter: boolean
  closeMode: CloseMode
}

// Why the URL changed, recorded by whoever changed it so the sync effect below
// can tell an intentional move from a browser Back. At most one is ever live.
type Expectation =
  | { type: 'opened'; key: string }
  | { type: 'closed'; key: string }
  | { type: 'back'; key: string; closeMode: CloseMode }

export type UseDetailRouteResult = {
  overlay: DetailOverlayState | null
  previousOverlay: DetailOverlayState | null
  openDetail: (detail: DetailRoute) => void
  requestExit: (closeMode?: CloseMode) => void
  completeEnter: () => void
  completeExit: () => void
}

// The panel outlives its route: it animates out after the URL already changed,
// and a detail-to-detail jump cross-fades two panels.
export function useDetailRoute({
  currentDetail,
  buildFallbackPath,
}: {
  currentDetail: DetailRoute | null
  buildFallbackPath: (detail: DetailOverlayState | null) => string
}): UseDetailRouteResult {
  const router = useRouter()
  const currentDetailKey = detailKey(currentDetail)

  const hydratedRef = useRef(false)
  const expectedRef = useRef<Expectation | null>(null)
  // How the exit currently animating should finish once it lands.
  const pendingCloseRef = useRef<CloseMode | null>(null)
  // Lets Back from a nested detail return to the previous panel, not the map.
  const historyRef = useRef<DetailOverlayState[]>([])
  const exitFallbackRef = useRef<number | null>(null)
  const enterFallbackRef = useRef<number | null>(null)

  const [overlay, setOverlay] = useState<DetailOverlayState | null>(() =>
    currentDetail
      ? { ...currentDetail, exiting: false, enter: false, closeMode: 'route' }
      : null
  )
  const [previousOverlay, setPreviousOverlay] =
    useState<DetailOverlayState | null>(null)

  const clearExitFallback = useCallback(() => {
    if (!exitFallbackRef.current) return
    window.clearTimeout(exitFallbackRef.current)
    exitFallbackRef.current = null
  }, [])

  const clearEnterFallback = useCallback(() => {
    if (!enterFallbackRef.current) return
    window.clearTimeout(enterFallbackRef.current)
    enterFallbackRef.current = null
  }, [])

  const completeEnter = useCallback(() => {
    clearEnterFallback()
    setPreviousOverlay(null)
  }, [clearEnterFallback])

  const completeExit = useCallback(() => {
    clearExitFallback()
    const pendingClose = pendingCloseRef.current
    pendingCloseRef.current = null
    setOverlay(null)
    if (!pendingClose || !overlay) return
    expectedRef.current = { type: 'closed', key: detailKey(overlay) }
    if (pendingClose === 'history') router.back()
    else router.replace(buildFallbackPath(overlay), { scroll: false })
  }, [buildFallbackPath, clearExitFallback, overlay, router])

  const requestExit = useCallback(
    (closeMode?: CloseMode) => {
      // Back out of a nested detail: no exit animation, the popped panel
      // arrives with the route.
      const previousDetail =
        closeMode === 'history' ? historyRef.current.pop() : undefined
      if (previousDetail) {
        expectedRef.current = {
          type: 'back',
          key: detailKey(previousDetail),
          closeMode: previousDetail.closeMode,
        }
        pendingCloseRef.current = null
        clearExitFallback()
        router.back()
        return
      }
      if (closeMode) pendingCloseRef.current = closeMode
      setOverlay((current) =>
        current ? { ...current, exiting: true } : current
      )
      clearExitFallback()
      exitFallbackRef.current = window.setTimeout(
        completeExit,
        PANEL_EXIT_MS + 100
      )
    },
    [clearExitFallback, completeExit, router]
  )

  const openDetail = useCallback((detail: DetailRoute) => {
    expectedRef.current = { type: 'opened', key: detailKey(detail) }
    setOverlay({ ...detail, exiting: false, enter: true, closeMode: 'route' })
  }, [])

  useEffect(() => {
    const expected = expectedRef.current
    const matches = expected?.key === currentDetailKey

    if (currentDetail) {
      if (expected?.type === 'closed' && matches) return
      const openedThis = expected?.type === 'opened' && matches
      const backToThis = expected?.type === 'back' && matches ? expected : null
      expectedRef.current = null
      const existingKey = detailKey(overlay)
      if (currentDetailKey === existingKey && openedThis) {
        setOverlay((current) =>
          current ? { ...current, closeMode: 'history' } : current
        )
        hydratedRef.current = true
        return
      }
      const closeMode = hydratedRef.current ? 'history' : 'route'
      if (currentDetailKey !== existingKey) {
        clearExitFallback()
        clearEnterFallback()
        pendingCloseRef.current = null
        if (overlay) {
          if (!backToThis) historyRef.current.push(overlay)
          setPreviousOverlay({ ...overlay, enter: false, exiting: false })
          enterFallbackRef.current = window.setTimeout(
            completeEnter,
            PANEL_ENTER_MS + 100
          )
        } else {
          setPreviousOverlay(null)
        }
        setOverlay({
          ...currentDetail,
          exiting: false,
          enter: hydratedRef.current,
          closeMode: backToThis ? backToThis.closeMode : closeMode,
        })
      }
      hydratedRef.current = true
      return
    }

    hydratedRef.current = true
    historyRef.current = []
    clearEnterFallback()
    setPreviousOverlay(null)
    const openedCurrent =
      expected?.type === 'opened' && expected.key === detailKey(overlay)
    expectedRef.current = openedCurrent ? expected : null
    if (openedCurrent) return
    if (!overlay || overlay.exiting) return
    requestExit()
  }, [
    clearExitFallback,
    clearEnterFallback,
    completeEnter,
    currentDetail,
    currentDetailKey,
    overlay,
    requestExit,
  ])

  useEffect(() => {
    return () => {
      clearEnterFallback()
      clearExitFallback()
    }
  }, [clearEnterFallback, clearExitFallback])

  return {
    overlay,
    previousOverlay,
    openDetail,
    requestExit,
    completeEnter,
    completeExit,
  }
}
