'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { appointmentsApi, availabilityApi, practicesApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

type Therapist = {
  id: string
  name: string
}

type Rating = {
  id: string
  rating: number
  kommentar?: string | null
  patient?: {
    name: string
  }
}

type PracticeDetail = {
  id: string
  name: string
  adresse: string
  plz: string
  stadt: string
  telefon?: string | null
  email?: string | null
  beschreibung?: string | null
  therapists: Therapist[]
  ratings: Rating[]
}

type AvailabilitySlot = {
  id: string
  datum: string
  startzeit: string
  endzeit: string
  status: string
}

function toDateOnly(value: string) {
  return value.split('T')[0]
}

function toHHMM(value: string) {
  return value.substring(11, 16)
}

export default function PracticeDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [practice, setPractice] = useState<PracticeDetail | null>(null)
  const [loadingPractice, setLoadingPractice] = useState(true)
  const [practiceError, setPracticeError] = useState('')

  const [selectedTherapistId, setSelectedTherapistId] = useState('')
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)

  const routePracticeId = String(params?.id || '')
  const prefilledDate = searchParams.get('date') || ''
  const prefilledTime = searchParams.get('time') || ''
  const prefilledTherapistId = searchParams.get('therapistId') || ''
  const prefilledTherapist = searchParams.get('therapist') || ''

  useEffect(() => {
    if (!token || !user) {
      router.push(`/login?redirect=/practices/${routePracticeId}`)
      return
    }

    if (user.role !== 'PATIENT') {
      router.push('/dashboard')
      return
    }

    const loadPractice = async () => {
      try {
        setLoadingPractice(true)
        const response = await practicesApi.get(routePracticeId)
        const data = response.data as PracticeDetail | null

        if (!data) {
          setPracticeError('Praxis nicht gefunden')
          return
        }

        setPractice(data)
        if (data.therapists.length > 0) {
          const matchedById = data.therapists.find((t) => t.id === prefilledTherapistId)
          const matchedByName = data.therapists.find((t) => t.name === prefilledTherapist)
          setSelectedTherapistId((matchedById || matchedByName || data.therapists[0]).id)
        }
      } catch {
        setPracticeError('Praxisdaten konnten nicht geladen werden')
      } finally {
        setLoadingPractice(false)
      }
    }

    void loadPractice()
  }, [token, user, router, routePracticeId, prefilledTherapistId, prefilledTherapist])

  useEffect(() => {
    if (!selectedTherapistId) {
      setAvailability([])
      return
    }

    const loadAvailability = async () => {
      try {
        setLoadingAvailability(true)
        const response = await availabilityApi.getByTherapist(
          selectedTherapistId,
          prefilledDate || new Date().toISOString().split('T')[0]
        )

        const all = (Array.isArray(response.data) ? response.data : []) as AvailabilitySlot[]
        const filtered = all.filter((slot) => slot.status === 'FREI' || slot.status === 'KURZFRISTIG_FREI')
        setAvailability(filtered)
      } catch {
        setAvailability([])
      } finally {
        setLoadingAvailability(false)
      }
    }

    void loadAvailability()
  }, [selectedTherapistId, prefilledDate])

  const avgRating = useMemo(() => {
    if (!practice || practice.ratings.length === 0) return null
    const sum = practice.ratings.reduce((acc, item) => acc + item.rating, 0)
    return sum / practice.ratings.length
  }, [practice])

  const handleSlotSelection = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
    setBookingError('')
    setBookingSuccess('')
  }

  const confirmBooking = async () => {
    if (!practice || !selectedTherapistId || !selectedSlot) return

    try {
      setBookingError('')
      setBookingSuccess('')
      setBookingInProgress(true)

      await appointmentsApi.create({
        practiceId: practice.id,
        therapistId: selectedTherapistId,
        datum: toDateOnly(selectedSlot.datum),
        uhrzeit: toHHMM(selectedSlot.startzeit),
        dauer: 30,
      })

      setBookingSuccess('Termin erfolgreich gebucht')
      setTimeout(() => router.push('/appointments'), 1500)
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Buchung fehlgeschlagen')
    } finally {
      setBookingInProgress(false)
    }
  }

  if (loadingPractice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Lade Praxisdaten...</p>
      </div>
    )
  }

  if (practiceError || !practice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md w-full text-center">
          <p className="text-red-700">{practiceError || 'Praxis nicht gefunden'}</p>
          <Link href="/search" className="mt-4 inline-block text-purple-700 hover:underline">
            Zurueck zur Suche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link href="/search" className="text-sm text-purple-700 hover:underline">
              Zurueck zur Suche
            </Link>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{practice.name}</h1>
            <p className="text-gray-600">{practice.adresse}, {practice.plz} {practice.stadt}</p>
            {practice.telefon && (
              <p className="text-sm mt-2">
                <a href={`tel:${practice.telefon}`} className="text-purple-700 hover:underline">{practice.telefon}</a>
              </p>
            )}

            <div className="mt-4 text-sm text-gray-700">
              <p>
                Bewertung: {avgRating !== null ? avgRating.toFixed(1) : 'Noch keine Bewertungen'}
              </p>
              <p>{practice.ratings.length} Bewertung{practice.ratings.length !== 1 ? 'en' : ''}</p>
            </div>

            {practice.beschreibung && (
              <p className="mt-4 text-sm text-gray-700">{practice.beschreibung}</p>
            )}
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Therapeut auswaehlen</h2>
            {practice.therapists.length === 0 ? (
              <p className="text-gray-600">Keine Therapeuten hinterlegt.</p>
            ) : (
              <select
                className="w-full max-w-md px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
              >
                {practice.therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Freie Termine</h2>
            {prefilledDate && prefilledTime && (
              <p className="text-sm text-green-700 mb-3">
                Vorauswahl aus Suche: {prefilledDate} um {prefilledTime}
              </p>
            )}

            {bookingError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {bookingSuccess}
              </div>
            )}

            {loadingAvailability ? (
              <p className="text-gray-600">Lade Verfuegbarkeiten...</p>
            ) : availability.length === 0 ? (
              <p className="text-gray-600">Keine freien Termine verfuegbar.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {availability.map((slot) => {
                    const date = toDateOnly(slot.datum)
                    const start = toHHMM(slot.startzeit)
                    const isPrefilled = date === prefilledDate && start === prefilledTime
                    const isSelected = selectedSlot?.id === slot.id

                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelection(slot)}
                        disabled={bookingInProgress}
                        className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-100 ring-2 ring-purple-300'
                            : isPrefilled
                            ? 'border-green-500 bg-green-100'
                            : 'border-green-200 bg-green-50 hover:bg-green-100'
                        } ${bookingInProgress ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <p className="text-sm font-semibold text-green-900">{date}</p>
                        <p className="text-sm text-green-800">{start} - {toHHMM(slot.endzeit)}</p>
                        <p className="text-xs text-green-700 mt-1">
                          {isSelected ? 'Ausgewaehlt' : 'Zum Auswaehlen klicken'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {selectedSlot && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-2xl font-bold text-white">Termin bestätigen</h2>
                        <p className="text-purple-100 text-sm mt-1">Überprüfen Sie Ihre Buchung</p>
                      </div>

                      {/* Content */}
                      <div className="px-6 py-6 space-y-6">
                        {/* Practice */}
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                            Praxis
                          </p>
                          <p className="text-lg font-bold text-gray-900">{practice.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {practice.adresse}
                          </p>
                          <p className="text-sm text-gray-600">
                            {practice.plz} {practice.stadt}
                          </p>
                          {practice.telefon && (
                            <p className="text-sm text-purple-700 mt-2">
                              <a href={`tel:${practice.telefon}`} className="hover:underline">
                                📞 {practice.telefon}
                              </a>
                            </p>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200"></div>

                        {/* Therapist */}
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                            Therapeut/in
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            👨‍⚕️ {practice.therapists.find((t) => t.id === selectedTherapistId)?.name || '-'}
                          </p>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                              Datum
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {new Date(toDateOnly(selectedSlot.datum)).toLocaleDateString('de-DE', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                              Uhrzeit
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {toHHMM(selectedSlot.startzeit)} Uhr
                            </p>
                          </div>
                        </div>

                        {/* Duration */}
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                            Dauer
                          </p>
                          <p className="text-base font-bold text-gray-900">30 Minuten</p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-600 text-center">
                            ℹ️ Nach der Buchung können Sie Ihren Termin jederzeit in 
                            <span className="font-semibold"> "Meine Termine"</span> absagen.
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
                        <button
                          onClick={() => setSelectedSlot(null)}
                          disabled={bookingInProgress}
                          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Ändern
                        </button>
                        <button
                          onClick={() => void confirmBooking()}
                          disabled={bookingInProgress}
                          className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bookingInProgress ? '⏳ Buche...' : '✅ Buchen'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
