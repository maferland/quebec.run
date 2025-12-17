declare module 'react-leaflet-markercluster' {
  import { ComponentType, ReactNode } from 'react'

  interface MarkerClusterGroupProps {
    children?: ReactNode
  }

  const MarkerClusterGroup: ComponentType<MarkerClusterGroupProps>
  export default MarkerClusterGroup
}
