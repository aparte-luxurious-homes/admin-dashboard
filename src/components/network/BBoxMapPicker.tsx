'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Icon } from '@iconify/react'
import 'leaflet/dist/leaflet.css'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BBoxResult {
  lat_min: number
  lat_max: number
  lng_min: number
  lng_max: number
}

// ── DrawInteraction ────────────────────────────────────────────────────────
// Events registered ONCE on mount — refs prevent stale closures and stop
// useMapEvents from accumulating duplicate listeners on every mousemove render.

interface DrawInteractionProps {
  onBoundsChange: (b: L.LatLngBounds | null) => void
  onDrawingChange: (drawing: boolean) => void
}

function DrawInteraction({ onBoundsChange, onDrawingChange }: DrawInteractionProps) {
  const map = useMap()

  const anchorRef    = useRef<L.LatLng | null>(null)
  const isDrawingRef = useRef(false)

  const onBoundsChangeRef  = useRef(onBoundsChange)
  const onDrawingChangeRef = useRef(onDrawingChange)
  useEffect(() => { onBoundsChangeRef.current  = onBoundsChange  }, [onBoundsChange])
  useEffect(() => { onDrawingChangeRef.current = onDrawingChange }, [onDrawingChange])

  const [previewBounds,   setPreviewBounds]   = useState<L.LatLngBounds | null>(null)
  const [confirmedBounds, setConfirmedBounds] = useState<L.LatLngBounds | null>(null)

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current) {
        anchorRef.current    = e.latlng
        isDrawingRef.current = true
        map.getContainer().style.cursor = 'crosshair'
        setPreviewBounds(null)
        setConfirmedBounds(null)
        onBoundsChangeRef.current(null)
        onDrawingChangeRef.current(true)
      } else {
        const b = new L.LatLngBounds(anchorRef.current!, e.latlng)
        anchorRef.current    = null
        isDrawingRef.current = false
        map.getContainer().style.cursor = 'default'
        setPreviewBounds(null)
        setConfirmedBounds(b)
        onBoundsChangeRef.current(b)
        onDrawingChangeRef.current(false)
      }
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (isDrawingRef.current && anchorRef.current) {
        setPreviewBounds(new L.LatLngBounds(anchorRef.current, e.latlng))
      }
    }

    map.on('click',     handleClick)
    map.on('mousemove', handleMouseMove)
    return () => {
      map.off('click',     handleClick)
      map.off('mousemove', handleMouseMove)
      map.getContainer().style.cursor = 'default'
    }
  }, [map])

  return (
    <>
      {previewBounds && (
        <Rectangle
          bounds={previewBounds}
          pathOptions={{ color: '#007080', fillColor: '#007080', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
        />
      )}
      {confirmedBounds && (
        <Rectangle
          bounds={confirmedBounds}
          pathOptions={{ color: '#007080', fillColor: '#007080', fillOpacity: 0.15, weight: 2 }}
        />
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function BBoxMapPicker({
  onConfirm,
  onClose,
}: {
  onConfirm: (bbox: BBoxResult) => void
  onClose: () => void
}) {
  const [bounds,    setBounds]    = useState<L.LatLngBounds | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [resetKey,  setResetKey]  = useState(0)

  const handleReset = () => {
    setBounds(null)
    setIsDrawing(false)
    setResetKey((k) => k + 1)
  }

  const handleApply = () => {
    if (!bounds) return
    onConfirm({
      lat_min: parseFloat(bounds.getSouth().toFixed(6)),
      lat_max: parseFloat(bounds.getNorth().toFixed(6)),
      lng_min: parseFloat(bounds.getWest().toFixed(6)),
      lng_max: parseFloat(bounds.getEast().toFixed(6)),
    })
  }

  const instruction = isDrawing
    ? 'Click to complete the box'
    : bounds
    ? `SW ${bounds.getSouth().toFixed(4)}, ${bounds.getWest().toFixed(4)}  ·  NE ${bounds.getNorth().toFixed(4)}, ${bounds.getEast().toFixed(4)}`
    : 'Click once to set the first corner, then click again to complete'

  return (
    <div className="flex flex-col">
      <div style={{ height: 420 }}>
        <MapContainer center={[6.45, 3.4]} zoom={11} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DrawInteraction
            key={resetKey}
            onBoundsChange={setBounds}
            onDrawingChange={setIsDrawing}
          />
        </MapContainer>
      </div>

      <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between gap-3 bg-white">
        <p className={`text-xs flex items-center gap-1.5 ${bounds && !isDrawing ? 'text-green-700' : 'text-gray-500'}`}>
          <Icon
            icon={isDrawing ? 'mdi:cursor-default-click' : bounds ? 'mdi:check-circle-outline' : 'mdi:information-outline'}
            width="14"
            className={bounds && !isDrawing ? 'text-green-600' : 'text-gray-400'}
          />
          {instruction}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {(bounds || isDrawing) && (
            <button onClick={handleReset} className="px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Reset
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!bounds || isDrawing}
            className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
