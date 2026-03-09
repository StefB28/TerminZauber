'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { practicesApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Therapist {
  id: string
  name: string
}

interface Practice {
  id: string
  name: string
  adresse: string
  plz: string
  stadt: string
  telefon?: string
  email?: string
  beschreibung?: string
}

interface AvailabilitySlot {
  id: string
  datum: string
  startzeit: string
  endzeit: string
  status: string
}

export default function TherapistProfilePage() {
  const params = useParams<{ id: string; therapistId: string }>()
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [practice, setPractice] = useState<Practice | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const practiceId = String(params?.id || '')
  const therapistId = String(params?.therapistId || '')

  useEffect(() => {
    if (!token || !user || user.role !== 'PATIENT') {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        // Load practice
        const practiceResponse = await practicesApi.get(practiceId)
        const practiceData = practiceResponse.data
        setPractice(practiceData)

        // Find therapist
        const foundTherapist = practiceData.therapists?.find(
          (t: Therapist) => t.id === therapistId
        )
        if (!foundTherapist) {
          setError('Therapeut nicht gefunden')
          return
        }
        setTherapist(foundTherapist)

        // In a real app, you'd call an API endpoint specifically for this therapist's availability
        // For now, we'll leave availability empty and the therapist can be booked through the practice detail page
      } catch (err) {
        setError('Fehler beim Laden der Therapeutendaten')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [practiceId, therapistId, token, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Lädt Therapeutenprofil...</p>
        </div>
      </div>
    )
  }

  if (error || !practice || !therapist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Fehler</h1>
          <p className="text-slate-600 mb-6">{error || 'Therapeut konnte nicht geladen werden'}</p>
          <Link
            href="/search"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Zurück zur Suche
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/practices/${practiceId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Zurück zur Praxis
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">👨‍⚕️ {therapist.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Therapist Info */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-6xl">
                  👨‍⚕️
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-900">{therapist.name}</h2>
                  <p className="text-blue-600 font-semibold mt-2">Physiotherapeut/in</p>
                  <p className="text-slate-600 mt-4">
                    Arbeitet in der Praxis <span className="font-semibold">{practice.name}</span>
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p>📍 {practice.adresse}</p>
                    <p>{practice.plz} {practice.stadt}</p>
                    {practice.telefon && (
                      <p>
                        📞{' '}
                        <a href={`tel:${practice.telefon}`} className="text-blue-600 hover:underline">
                          {practice.telefon}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Über diese/n Therapeut/in</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-slate-900">
                      Diese/r Therapeut/in ist Teil des Teams der Praxis{' '}
                      <span className="font-semibold">{practice.name}</span>. Sie/Er kümmert sich um
                      Ihre Gesundheit und bietet professionelle Physiotherapie.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Fachbereich</p>
                      <p className="text-lg font-semibold text-slate-900">Physiotherapie</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-2">
                        Verfügbarkeit
                      </p>
                      <p className="text-lg font-semibold text-slate-900">Nach Praxis</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border-t border-slate-200 pt-8 mt-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Spezialisierungen</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Rückenschmerzen',
                    'Sportverletzungen',
                    'Rehabilitation',
                    'Mobilität',
                    'Bewegungstherapie',
                    'Schmerzlinderung',
                  ].map((skill) => (
                    <div
                      key={skill}
                      className="bg-blue-100 text-blue-900 rounded-lg px-4 py-2 text-sm font-semibold text-center"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Info */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Termin buchen</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Praxis</p>
                  <p className="text-slate-900 font-semibold">{practice.name}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">
                    Haupttherapeutin/Therapeut
                  </p>
                  <p className="text-slate-900 font-semibold">{therapist.name}</p>
                </div>

                <div className="bg-slope-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Standort</p>
                  <p className="text-sm text-slate-900">
                    {practice.plz} {practice.stadt}
                  </p>
                </div>
              </div>

              <Link
                href={`/practices/${practiceId}?therapistId=${therapistId}&therapist=${encodeURIComponent(therapist.name)}`}
                className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center transition-colors"
              >
                📅 Termin buchen
              </Link>

              <p className="text-xs text-slate-600 mt-4 text-center">
                Sie werden weitergeleitet zur Praxisseite, wo Sie einen freien Termin mit diesem/dieser
                Therapeut/in buchen können.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
