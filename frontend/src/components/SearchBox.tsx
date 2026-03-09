'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const cities = [
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Frankfurt am Main",
  "Stuttgart",
  "Dresden",
  "Leipzig",
  "Chemnitz",
  "Plauen",
  "Hannover",
  "Nürnberg",
  "Hof",
  "Annaberg-Buchholz",
  "Bonn",
  "Potsdam",
  "Friedrichshafen",
  "Jena",
  "Erfurt",
  "Kassel",
  "Augsburg",
  "Karlsruhe",
  "Essen",
  "Mannheim",
  "Bremen",
  "Lübeck",
  "Kiel",
  "Rostock",
  "Regensburg",
  "Düsseldorf",
  "Freiburg im Breisgau",
  "Leonberg",
]

export default function SearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<string[]>([])

  const handleChange = (value:string) => {
    setQuery(value)
    const filtered = cities.filter(city =>
      city.toLowerCase().includes(value.toLowerCase())
    )
    setResults(filtered)
  }

  const selectCity = (city:string) => {
    setQuery(city)
    setResults([])
    router.push(`/search?location=${city}`)
  }

  return (
    <div className="relative w-full">
      <input
        value={query}
        onChange={(e)=>handleChange(e.target.value)}
        placeholder="Ort oder PLZ eingeben"
        className="w-full border px-5 py-3 rounded-lg"
      />
      {results.length > 0 && (
        <div className="absolute bg-white shadow-lg rounded-lg mt-2 w-full z-20">
          {results.map((city)=>(
            <div
              key={city}
              onClick={()=>selectCity(city)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
