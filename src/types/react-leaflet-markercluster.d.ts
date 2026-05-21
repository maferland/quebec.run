declare module 'react-leaflet-markercluster' {
  import { ComponentType, ReactNode } from 'react'
  import type { DivIcon } from 'leaflet'

  type MarkerCluster = { getChildCount: () => number }

  interface MarkerClusterGroupProps {
    children?: ReactNode
    iconCreateFunction?: (cluster: MarkerCluster) => DivIcon
    showCoverageOnHover?: boolean
    spiderfyOnMaxZoom?: boolean
    zoomToBoundsOnClick?: boolean
    maxClusterRadius?: number
  }

  const MarkerClusterGroup: ComponentType<MarkerClusterGroupProps>
  export default MarkerClusterGroup
}
