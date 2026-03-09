'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'

// Fix for default marker icons in Next.js
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type Practice = {
  id: string
  name: string
  adresse: string
  plz: string
  stadt: string
  lat?: number
  lng?: number
}

type PracticeMapProps = {
  practices: Practice[]
  center?: [number, number]
}

// Simple PLZ-based coordinate approximation for Germany
// This is a rough approximation - in production, use a proper geocoding service
function getApproxCoordinates(plz: string): [number, number] {
  const firstTwo = parseInt(plz.substring(0, 2), 10)
  
  // Approximate coordinates based on first two digits of PLZ
  // These are rough estimates for visualization purposes
  const plzMap: Record<number, [number, number]> = {
    10: [52.52, 13.405], // Berlin
    20: [53.55, 9.99],   // Hamburg
    30: [52.37, 9.74],   // Hannover
    40: [51.23, 6.78],   // Düsseldorf
    50: [50.94, 6.96],   // Köln
    60: [50.11, 8.68],   // Frankfurt
    70: [48.78, 9.18],   // Stuttgart
    80: [48.14, 11.58],  // München
    90: [49.45, 11.08],  // Nürnberg
    1: [52.13, 11.63],   // Magdeburg area
    2: [53.07, 8.8],     // Bremen area
    3: [52.27, 10.52],   // Braunschweig area
    4: [51.34, 12.37],   // Leipzig area
    5: [50.73, 7.1],     // Bonn area
    6: [49.99, 8.24],    // Mainz area
    7: [48.69, 9.14],    // Stuttgart area
    8: [48.37, 10.89],   // München area
    9: [49.47, 10.98],   // Nürnberg area
  }
  
  return plzMap[firstTwo] || plzMap[Math.floor(firstTwo / 10)] || [51.1657, 10.4515] // Default to center of Germany
}

export default function PracticeMap({ practices, center }: PracticeMapProps) {
  const defaultCenter: [number, number] = center || [51.1657, 10.4515] // Center of Germany
  
  const practicesWithCoords = practices.map((practice) => ({
    ...practice,
    coords: getApproxCoordinates(practice.plz),
  }))

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {practicesWithCoords.map((practice) => (
          <Marker
            key={practice.id}
            position={practice.coords}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{practice.name}</p>
                <p className="text-xs text-gray-600">
                  {practice.adresse}, {practice.plz} {practice.stadt}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
