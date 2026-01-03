import React, { useState, useRef } from 'react'
import { MapPin, Loader2, Check } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L, { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
        { headers: { 'User-Agent': 'TapLive' } }
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

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'TapLive' } }
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
    <div className="w-full space-y-4">
      {/* Input with icon */}
      <div className="relative">
        <Input
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Enter address"
          className="pr-12"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={geocodeAddress}
          disabled={loading}
          className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-primary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="sr-only">Locate</span>
        </Button>
      </div>

      {/* Map bottom sheet */}
      {mapOpen && position && (
        <Card className="overflow-hidden border border-border shadow-lg animate-in slide-in-from-top-2">
          <div className="h-[280px] w-full relative">
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
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
          </div>

          <div className="p-3 bg-muted/30 border-t border-border space-y-3">
            <div className="text-xs text-muted-foreground truncate px-1">
              <MapPin className="inline-block w-3 h-3 mr-1 mb-0.5" />
              {tempAddress || 'Move marker to adjust location'}
            </div>
            <Button 
              onClick={handleDone} 
              className="w-full h-9 text-sm"
              size="sm"
            >
              <Check className="w-3.5 h-3.5 mr-2" />
              Confirm Location
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default LocationPicker
