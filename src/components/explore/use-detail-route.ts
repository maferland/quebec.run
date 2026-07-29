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
  const pendingCloseRef = useRef<CloseMode | null>(null)
  const pendingOpenRef = useRef<string | null>(null)
  const closingDetailKeyRef = useRef<string | null>(null)
  // Lets Back from a nested detail return to the previous panel, not the map.
  const historyRef = useRef<DetailOverlayState[]>([])
  const pendingBackRef = useRef<string | null>(null)
  const pendingBackCloseModeRef = useRef<CloseMode | null>(null)
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
    if (pendingClose === 'history') {
      closingDetailKeyRef.current = detailKey(overlay)
      setOverlay(null)
      router.back()
      return
    }
    if (pendingClose === 'route') {
      closingDetailKeyRef.current = detailKey(overlay)
      setOverlay(null)
      router.replace(buildFallbackPath(overlay), { scroll: false })
      return
    }
    setOverlay(null)
  }, [buildFallbackPath, clearExitFallback, overlay, router])

  const requestExit = useCallback(
    (closeMode?: CloseMode) => {
      if (closeMode === 'history' && historyRef.current.length > 0) {
        const previousDetail = historyRef.current.pop() ?? null
        pendingBackRef.current = detailKey(previousDetail)
        pendingBackCloseModeRef.current = previousDetail?.closeMode ?? 'history'
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
    closingDetailKeyRef.current = null
    pendingOpenRef.current = detailKey(detail)
    setOverlay({ ...detail, exiting: false, enter: true, closeMode: 'route' })
  }, [])

  useEffect(() => {
    if (currentDetail) {
      if (closingDetailKeyRef.current === currentDetailKey) return
      closingDetailKeyRef.current = null
      const existingKey = detailKey(overlay)
      const isPendingOpen = pendingOpenRef.current === currentDetailKey
      if (isPendingOpen) pendingOpenRef.current = null
      if (currentDetailKey === existingKey && isPendingOpen) {
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
        const isDetailBack = pendingBackRef.current === currentDetailKey
        pendingBackRef.current = null
        const detailBackCloseMode = pendingBackCloseModeRef.current
        pendingBackCloseModeRef.current = null
        if (overlay) {
          if (!isDetailBack) historyRef.current.push(overlay)
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
          closeMode: isDetailBack
            ? (detailBackCloseMode ?? 'route')
            : closeMode,
        })
      }
      hydratedRef.current = true
      return
    }

    hydratedRef.current = true
    closingDetailKeyRef.current = null
    historyRef.current = []
    pendingBackRef.current = null
    pendingBackCloseModeRef.current = null
    clearEnterFallback()
    setPreviousOverlay(null)
    if (pendingOpenRef.current && pendingOpenRef.current === detailKey(overlay))
      return
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
