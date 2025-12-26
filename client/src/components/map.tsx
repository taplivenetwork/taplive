import React, { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L, { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LocationResult {
  lat: number
  lng: number
  address?: string
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationResult) => void
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
  const [addressInput, setAddressInput] = useState('')
  const [tempAddress, setTempAddress] = useState('')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const mapRef = useRef<LeafletMap>(null)

  // Forward geocoding
  const geocodeAddress = async () => {
    if (!addressInput.trim()) return
    setLoading(true)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressInput
        )}`,
        { headers: { 'User-Agent': 'YourAppNameHere' } }
      )
      const data = await res.json()

      if (data?.length) {
        const { lat, lon, display_name } = data[0]
        setPosition({ lat: +lat, lng: +lon })
        setTempAddress(display_name)
        setMapOpen(true)
      } else {
        alert('Address not found')
      }
    } catch {
      alert('Geocoding failed')
    }

    setLoading(false)
  }

  // Reverse geocoding (on drag end)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'YourAppNameHere' } }
      )
      const data = await res.json()
      setTempAddress(data?.display_name || '')
    } catch {
      setTempAddress('')
    }
  }

  const handleDone = () => {
    if (!position) return
    setAddressInput(tempAddress)
    onLocationSelect({ ...position, address: tempAddress })
    setMapOpen(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', fontFamily: 'system-ui' }}>
      {/* Address input */}
      <input
        value={addressInput}
        onChange={(e) => setAddressInput(e.target.value)}
        placeholder='Enter address'
        style={{
          width: '100%',
          padding: 12,
          fontSize: 15,
          borderRadius: 8,
          border: '1px solid #ccc',
        }}
      />

      {/* Locate button */}
      <button
        onClick={geocodeAddress}
        disabled={loading}
        style={{
          marginTop: 10,
          width: '100%',
          padding: 12,
          borderRadius: 8,
          background: '#111',
          color: '#fff',
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        📍 Locate on map
      </button>

      {/* Map bottom sheet */}
      {mapOpen && position && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            background: '#fff',
          }}
        >
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: 280, width: '100%' }}
            ref={mapRef}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <Marker
              draggable
              position={position}
              eventHandlers={{
                dragend: (e) => {
                  const latLng = (e.target as L.Marker).getLatLng()
                  setPosition(latLng)
                  reverseGeocode(latLng.lat, latLng.lng)
                },
              }}
            >
              <Tooltip permanent direction='top'>
                Drag to adjust
              </Tooltip>
            </Marker>
          </MapContainer>

          {/* Address preview + done */}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 8, color: '#555' }}>
              {tempAddress || 'Move marker to adjust location'}
            </div>
            <button
              onClick={handleDone}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                background: '#0d6efd',
                color: '#fff',
                fontSize: 15,
                border: 'none',
              }}
            >
              ✅ Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
