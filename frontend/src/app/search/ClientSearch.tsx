'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { searchApi, waitlistApi } from '@/lib/api'

// Dynamically import map to avoid SSR issues with Leaflet
const PracticeMap = dynamic(() => import('@/components/PracticeMap'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">Lade Karte...</div>,
})

type TreatmentType = {
  id: string
  name: string
  beschreibung?: string | null
  dauer?: number
}

type AvailableSlot = {
  datum: string
  zeit: string
  therapistId: string
  therapist: string
  treatments: string[]
}

type SearchPracticeResult = {
  id: string
  name: string
  adresse: string
  stadt: string
  plz: string
  telefon?: string | null
  beschreibung?: string | null
  rating: number | null
  reviewCount: number
  hasAvailableSlots: boolean
  availableSlots: AvailableSlot[]
}

// Simple distance calculation based on PLZ similarity
// In production, use proper geocoding and distance calculation
function calculateApproxDistance(plz1: string, plz2: string): number {
  const diff = Math.abs(parseInt(plz1.substring(0, 2), 10) - parseInt(plz2.substring(0, 2), 10))
  
  // Very rough approximation: each PLZ digit difference ≈ 30km
  // This is just for display purposes
  if (plz1.substring(0, 2) === plz2.substring(0, 2)) {
    // Same first two digits - likely within 0-20km
    const subDiff = Math.abs(parseInt(plz1.substring(2, 3), 10) - parseInt(plz2.substring(2, 3), 10))
    return Math.min(5 + subDiff * 2, 20)
  }
  
  return Math.min(diff * 30, 200)
}

export default function ClientSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams.get('plz') || searchParams.get('ort') || '')
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '')
  const [radius, setRadius] = useState(Number(searchParams.get('radius') || '2'))
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>(
    searchParams.get('treatments')?.split(',').filter(Boolean) || []
  )

  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([])
  const [results, setResults] = useState<SearchPracticeResult[]>([])
  const [loadingTreatments, setLoadingTreatments] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [includeWithoutSlots, setIncludeWithoutSlots] = useState(false)
  const [joiningPracticeId, setJoiningPracticeId] = useState<string | null>(null)

  const resultsWithDistance = useMemo(() => {
    const normalizedPlz = /^\d{5}$/.test(location.trim()) ? location.trim() : ''

    const withDistance = results.map((practice) => ({
      ...practice,
      distance: normalizedPlz ? calculateApproxDistance(normalizedPlz, practice.plz) : null,
    }))

    return withDistance
      .filter((practice) => practice.distance === null || practice.distance <= radius)
      .sort((a, b) => {
        const distanceA = a.distance ?? Number.MAX_SAFE_INTEGER
        const distanceB = b.distance ?? Number.MAX_SAFE_INTEGER
        return distanceA - distanceB
      })
  }, [results, location, radius])

  useEffect(() => {
    const loadTreatmentTypes = async () => {
      try {
        setLoadingTreatments(true)
        const response = await searchApi.getTreatmentTypes()
        setTreatmentTypes(Array.isArray(response.data) ? response.data : [])
      } catch {
        setError('Behandlungsarten konnten nicht geladen werden')
      } finally {
        setLoadingTreatments(false)
      }
    }

    loadTreatmentTypes()
  }, [])

  useEffect(() => {
    if (location.trim().length > 0) {
      void performSearch(true)
    }
  }, [])

  const updateUrlParams = () => {
    const params = new URLSearchParams()
    const trimmedLocation = location.trim()

    if (/^\d{5}$/.test(trimmedLocation)) {
      params.set('plz', trimmedLocation)
    } else {
      params.set('ort', trimmedLocation)
    }

    if (selectedDate) params.set('date', selectedDate)
    if (radius) params.set('radius', String(radius))
    if (selectedTreatments.length > 0) params.set('treatments', selectedTreatments.join(','))

    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const performSearch = async (silent = false, includeWithoutSlotsOverride?: boolean) => {
    const trimmedLocation = location.trim()

    if (!trimmedLocation) {
      setError('Bitte geben Sie eine PLZ oder einen Ort ein')
      return
    }

    const includeWithoutSlotsValue = includeWithoutSlotsOverride ?? includeWithoutSlots

    if (!silent) updateUrlParams()

    setLoading(true)
    setError('')
    setSearched(true)

    const isPostalCode = /^\d{5}$/.test(trimmedLocation)

    try {
      const response = await searchApi.searchSlots({
        plz: isPostalCode ? trimmedLocation : undefined,
        ort: isPostalCode ? undefined : trimmedLocation,
        date: selectedDate || undefined,
        radius,
        treatments: selectedTreatments.length > 0 ? selectedTreatments : undefined,
        includeWithoutSlots: includeWithoutSlotsValue,
      })

      setResults(Array.isArray(response.data) ? response.data : [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Suche fehlgeschlagen')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await performSearch()
  }

  const handleJoinWaitlist = async (practiceId: string) => {
    const trimmedLocation = location.trim()
    const normalizedPlz = /^\d{5}$/.test(trimmedLocation) ? trimmedLocation : '00000'

    try {
      setJoiningPracticeId(practiceId)
      await waitlistApi.join({
        practiceId,
        plz: normalizedPlz,
        radius,
        wunschdatum: selectedDate || undefined,
      })
      alert('Sie wurden auf die Warteliste gesetzt. Bei freien Terminen erhalten Sie eine E-Mail.')
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login?redirect=/search')
        return
      }
      alert(err?.response?.data?.message || 'Warteliste konnte nicht gesetzt werden')
    } finally {
      setJoiningPracticeId(null)
    }
  }

  const toggleTreatment = (treatmentId: string) => {
    setSelectedTreatments((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId]
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium shadow-lg">
        Finde kurzfristige Physiotherapie-Termine in deiner Naehe
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Termin finden</h2>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PLZ oder Ort</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="z.B. 10115 oder Berlin"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Datum (optional)</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Radius: {radius} km</label>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                  disabled={loadingTreatments}
                >
                  {showFilters ? 'Behandlungsarten ausblenden' : 'Behandlungsarten filtern'}
                </button>
              </div>

              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Behandlungsarten</h3>
                  {loadingTreatments ? (
                    <p className="text-sm text-gray-500">Lade Behandlungsarten...</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {treatmentTypes.map((treatment) => (
                        <label key={treatment.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTreatments.includes(treatment.id)}
                            onChange={() => toggleTreatment(treatment.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{treatment.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg"
              >
                {loading ? 'Suche laeuft...' : 'Termine suchen'}
              </button>

              <button
                type="button"
                disabled={loading}
                  onClick={async () => {
                  setIncludeWithoutSlots(true)
                    await performSearch(false, true)
                }}
                className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Alle Praxen im Umkreis anzeigen (inkl. ohne freie Termine)
              </button>

              {includeWithoutSlots && (
                <p className="text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  Modus aktiv: Es werden auch Praxen ohne freie Termine angezeigt. Sie koennen sich
                  dort auf die Warteliste setzen lassen.
                </p>
              )}
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {searched && !loading && results.length === 0 && !error && (
            <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Termine gefunden</h3>
              <p className="text-gray-600">Versuchen Sie einen groesseren Radius oder ein anderes Datum.</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {results.length} Praxis{results.length !== 1 ? 'en' : ''} gefunden
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  {showMap ? 'Karte ausblenden' : 'Karte anzeigen'}
                </button>
              </div>

              {showMap && (
                <div className="mb-6">
                  <PracticeMap practices={results} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {resultsWithDistance.map((practice) => (
                  <div key={practice.id} className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{practice.name}</h4>
                          {practice.distance !== null && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              ~{practice.distance} km
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {practice.adresse}, {practice.plz} {practice.stadt}
                        </p>
                        {practice.telefon && (
                          <a className="text-sm text-purple-700 hover:underline" href={`tel:${practice.telefon}`}>
                            {practice.telefon}
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>
                          Bewertung:{' '}
                          {practice.rating !== null ? practice.rating.toFixed(1) : 'Noch keine Bewertungen'}
                        </p>
                        <p>{practice.reviewCount} Bewertung{practice.reviewCount !== 1 ? 'en' : ''}</p>
                      </div>
                    </div>

                    {practice.beschreibung && (
                      <p className="text-gray-600 text-sm mb-4">{practice.beschreibung}</p>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">Naechste freie Termine</h5>
                      {practice.availableSlots.length === 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500">Keine freien Slots in diesem Zeitraum</p>
                          <button
                            type="button"
                            onClick={() => void handleJoinWaitlist(practice.id)}
                            disabled={joiningPracticeId === practice.id}
                            className="inline-flex items-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            {joiningPracticeId === practice.id
                              ? 'Wird eingetragen...'
                              : 'Auf Warteliste setzen (E-Mail bei freiem Termin)'}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {practice.availableSlots.slice(0, 6).map((slot, index) => (
                            <Link
                              key={`${practice.id}-${slot.datum}-${slot.zeit}-${index}`}
                              href={`/practices/${practice.id}?date=${slot.datum}&time=${slot.zeit}&therapistId=${slot.therapistId}&therapist=${encodeURIComponent(slot.therapist)}`}
                              className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 hover:bg-green-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-green-900">{slot.datum} {slot.zeit}</p>
                              <p className="text-xs text-green-800">{slot.therapist}</p>
                              <p className="text-xs text-green-700 mt-1">Diesen Termin auswaehlen</p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/practices/${practice.id}`}
                        className="inline-flex items-center rounded-lg border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
                      >
                        Praxisdetails und Buchung
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
