'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface ViewBBox {
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
}

function FitBounds({ bbox }: { bbox: ViewBBox }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(
      new L.LatLngBounds([bbox.lat_min, bbox.lng_min], [bbox.lat_max, bbox.lng_max]),
      { padding: [40, 40] },
    )
  }, [map, bbox])
  return null
}

export default function BBoxMapViewer({ bbox }: { bbox: ViewBBox }) {
  const center: [number, number] = [
    (bbox.lat_min + bbox.lat_max) / 2,
    (bbox.lng_min + bbox.lng_max) / 2,
  ]
  const bounds = new L.LatLngBounds(
    [bbox.lat_min, bbox.lng_min],
    [bbox.lat_max, bbox.lng_max],
  )

  return (
    <div style={{ height: 420 }}>
      <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bbox={bbox} />
        <Rectangle
          bounds={bounds}
          pathOptions={{ color: '#007080', fillColor: '#007080', fillOpacity: 0.15, weight: 2 }}
        />
      </MapContainer>
    </div>
  )
}
