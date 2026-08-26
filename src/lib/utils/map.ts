import type { IconOptions } from 'leaflet'

/**
 * Marker pin for all maps, in the app accent. Base64 SVG so there is no
 * external asset to fetch.
 */
export const markerIconConfig: IconOptions = {
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk2NDQgMCAwIDUuNTk2NDQgMCAxMi41QzAgMjEuODc1IDEyLjUgNDEgMTIuNSA0MUMyNS41IDE5IDI1IDIxLjg3NSAyNSAxMi41QzI1IDUuNTk2NDQgMTkuNDAzNiAwIDEyLjUgMFoiIGZpbGw9IiNDOUE1RjgiLz48Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNSIgZmlsbD0iIzJGMUY0QSIvPjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
}

/**
 * Create marker icon instance for use with vanilla Leaflet
 */
export function createMarkerIcon(L: typeof import('leaflet')) {
  return new L.Icon(markerIconConfig)
}

/**
 * CARTO gates its basemaps behind a key as of 2026: keyless tiles come back
 * stamped "API KEY REQUIRED". Free non-commercial keys come from
 * https://carto.com/basemaps/apikey/. Without one the maps still render, just
 * watermarked, so local dev works with the variable unset.
 */
function withCartoKey(url: string) {
  const key = process.env.NEXT_PUBLIC_CARTO_KEY
  return key ? `${url}?key=${key}` : url
}

export const TILE_URLS = {
  dark: withCartoKey(
    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
  ),
  light: withCartoKey(
    'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
  ),
  // Admin address preview: Positron with labels, at retina density.
  positron: withCartoKey(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  ),
} as const

/** Required by the CARTO basemap terms; must stay visible on every map. */
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
