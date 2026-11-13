'use client'

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import axiosRequest from '@/src/lib/api'
import { API_ROUTES } from '@/src/lib/routes/endpoints'
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import type { BBoxResult } from '@/src/components/network/BBoxMapPicker'

const BBoxMapPicker = dynamic(() => import('@/src/components/network/BBoxMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center" style={{ height: 420 }}>
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

async function reverseGeocode(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'AparteAdminDashboard/1.0' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data?.address ?? {}
    return {
      city:    addr.city || addr.town || addr.village || addr.county || '',
      state:   addr.state   || '',
      country: addr.country || '',
    }
  } catch {
    return null
  }
}

type ZoneType = 'CITY' | 'AREA' | 'REGION'

interface Zone { id: string; name: string; type: ZoneType }

function buildResolverConfig(
  city: string, state: string, country: string,
  latMin: string, latMax: string, lngMin: string, lngMax: string,
): Record<string, any> | null {
  const obj: Record<string, any> = {}
  if (city.trim())    obj.city    = city.trim()
  if (state.trim())   obj.state   = state.trim()
  if (country.trim()) obj.country = country.trim()
  const bboxAny = [latMin, latMax, lngMin, lngMax].some((v) => v.trim() !== '')
  if (bboxAny) {
    const bbox: Record<string, number> = {}
    if (latMin.trim() !== '') bbox.lat_min = parseFloat(latMin)
    if (latMax.trim() !== '') bbox.lat_max = parseFloat(latMax)
    if (lngMin.trim() !== '') bbox.lng_min = parseFloat(lngMin)
    if (lngMax.trim() !== '') bbox.lng_max = parseFloat(lngMax)
    obj.bbox = bbox
  }
  return Object.keys(obj).length > 0 ? obj : null
}

export default function CreateZonePage() {
  const router = useRouter()
  const [allZones, setAllZones] = useState<Zone[]>([])

  const [name, setName]         = useState('')
  const [type, setType]         = useState<ZoneType>('CITY')
  const [parentId, setParentId] = useState('')
  const [city, setCity]         = useState('')
  const [state, setState]       = useState('')
  const [country, setCountry]   = useState('')
  const [latMin, setLatMin]     = useState('')
  const [latMax, setLatMax]     = useState('')
  const [lngMin, setLngMin]     = useState('')
  const [lngMax, setLngMax]     = useState('')

  const [showMap, setShowMap]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Two-step geo flow: bbox → ask → geocode
  const [pendingGeo, setPendingGeo]         = useState<BBoxResult | null>(null)
  const [showGeoAsk, setShowGeoAsk]         = useState(false)
  const [isGeocoding, setIsGeocoding]       = useState(false)

  useEffect(() => {
    axiosRequest
      .get(API_ROUTES.network.configs.zones.base, { params: { page: 1, size: 200 } })
      .then((res) => {
        const data = res?.data?.data ?? res?.data
        const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : [])
        setAllZones(items)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    const resolver = buildResolverConfig(city, state, country, latMin, latMax, lngMin, lngMax)
    setIsSubmitting(true)
    try {
      await toast.promise(
        axiosRequest.post(API_ROUTES.network.configs.zones.base, {
          type,
          name: name.trim(),
          ...(parentId ? { parent_zone_id: parentId } : {}),
          ...(resolver  ? { resolver_config: resolver } : {}),
        }),
        {
          loading: 'Creating zone...',
          success: 'Zone created',
          error: (err) => err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create zone',
        },
      )
      router.push(PAGE_ROUTES.dashboard.network.zones.base)
    } catch {
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasBbox = [latMin, latMax, lngMin, lngMax].some((v) => v.trim() !== '')
  const parentLabel = allZones.find((z) => z.id === parentId)?.name

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icon icon="mdi:arrow-left" width="20" className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create Zone</h1>
          <p className="text-sm text-gray-500">Define a geographic city, area, or region</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">

          {/* Zone Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Zone Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos Island"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ZoneType)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50"
            >
              <option value="CITY">CITY</option>
              <option value="AREA">AREA</option>
              <option value="REGION">REGION</option>
            </select>
          </div>

          {/* Parent Zone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Parent Zone <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50"
            >
              <option value="">None</option>
              {allZones.map((z) => (
                <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
              ))}
            </select>
          </div>

          {/* Resolver Config */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Resolver Config <span className="font-normal text-gray-400">(optional)</span>
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-4">
              {/* City / State / Country */}
              {([
                { label: 'City',    value: city,    set: setCity,    ph: 'e.g. Lagos Island' },
                { label: 'State',   value: state,   set: setState,   ph: 'e.g. Lagos'        },
                { label: 'Country', value: country, set: setCountry, ph: 'e.g. Nigeria'      },
              ] as const).map(({ label, value, set, ph }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                    placeholder={ph}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  />
                </div>
              ))}

              {/* Bounding Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">
                    Bounding Box <span className="font-normal text-gray-400">(coordinates)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Icon icon="mdi:map-search-outline" width="13" />
                    Draw on Map
                  </button>
                </div>

                {hasBbox && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                    <Icon icon="mdi:check-circle-outline" width="13" />
                    Bounds set — you can still edit the values below
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Lat min', value: latMin, set: setLatMin, ph: 'e.g. 6.42' },
                    { label: 'Lat max', value: latMax, set: setLatMax, ph: 'e.g. 6.48' },
                    { label: 'Lng min', value: lngMin, set: setLngMin, ph: 'e.g. 3.38' },
                    { label: 'Lng max', value: lngMax, set: setLngMax, ph: 'e.g. 3.42' },
                  ] as const).map(({ label, value, set, ph }) => (
                    <div key={label} className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">{label}</label>
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => (set as (v: string) => void)(e.target.value)}
                        placeholder={ph}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) { toast.error(MESSAGES.MSG_ZONE_NAME_IS_REQUIRED); return }
              setShowConfirm(true)
            }}
            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Icon icon="mdi:plus" width="14" />
            Create Zone
          </button>
        </div>
      </div>

      {/* Map modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Draw Bounding Box</h3>
                <p className="text-xs text-gray-500 mt-0.5">Click twice on the map to outline the zone area</p>
              </div>
              <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Icon icon="lucide:x" width="18" className="text-gray-500" />
              </button>
            </div>
            <BBoxMapPicker
              onConfirm={(bbox) => {
                // 1. Populate bbox fields and close map immediately
                setLatMin(String(bbox.lat_min))
                setLatMax(String(bbox.lat_max))
                setLngMin(String(bbox.lng_min))
                setLngMax(String(bbox.lng_max))
                setShowMap(false)
                // 2. Ask user if they want City/State/Country auto-filled
                setPendingGeo(bbox)
                setShowGeoAsk(true)
              }}
              onClose={() => setShowMap(false)}
            />
          </div>
        </div>
      )}

      {/* Geo auto-fill ask */}
      {showGeoAsk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon icon="mdi:map-marker-question-outline" width="22" className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Auto-fill address fields?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Would you like us to look up the City, State and Country for the selected area and fill those fields automatically?
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setShowGeoAsk(false); setPendingGeo(null) }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                No thanks
              </button>
              <button
                disabled={isGeocoding}
                onClick={async () => {
                  if (!pendingGeo) { setShowGeoAsk(false); return }
                  setIsGeocoding(true)
                  const centerLat = (pendingGeo.lat_min + pendingGeo.lat_max) / 2
                  const centerLng = (pendingGeo.lng_min + pendingGeo.lng_max) / 2
                  const location = await reverseGeocode(centerLat, centerLng)
                  setIsGeocoding(false)
                  // Silently ignore API failures — just close modal
                  if (location) {
                    if (location.city)    setCity(location.city)
                    if (location.state)   setState(location.state)
                    if (location.country) setCountry(location.country)
                  }
                  setShowGeoAsk(false)
                  setPendingGeo(null)
                }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
              >
                {isGeocoding ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Looking up…
                  </>
                ) : 'Yes, auto-fill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon icon="mdi:map-marker-plus-outline" width="24" className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Create zone?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Create <span className="font-semibold text-gray-700">{name}</span> as a{' '}
                <span className="font-semibold text-gray-700">{type}</span> zone
                {parentLabel ? ` under ${parentLabel}` : ''}.
              </p>
            </div>
            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit() }}
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                Yes, create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
