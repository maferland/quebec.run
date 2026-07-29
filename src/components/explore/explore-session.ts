import type * as L from 'leaflet'

// A locale switch remounts the whole explore tree without reloading the page.
// Anything that should happen once per visit, not once per mount, lives here.
let painted = false
let viewport: { center: L.LatLng; zoom: number } | null = null

export const hasPainted = () => painted
export const markPainted = () => {
  painted = true
}

export const getViewport = () => viewport
export const setViewport = (next: { center: L.LatLng; zoom: number }) => {
  viewport = next
}

// Test-only: module state would otherwise leak between cases.
export const resetExploreSession = () => {
  painted = false
  viewport = null
}
