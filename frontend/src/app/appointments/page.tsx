'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { appointmentsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import RescheduleModal from '@/components/RescheduleModal'

type Appointment = {
  id: string
  datum: string
  uhrzeit: string
  dauer: number
  status: string
  practice: {
    id: string
    name: string
    adresse: string
    plz: string
    stadt: string
    telefon?: string | null
  }
  therapist: {
    id: string
    name: string
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeStr: string) {
  return timeStr.substring(0, 5)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'GEBUCHT':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'FREI':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'KURZFRISTIG_FREI':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'ABGESAGT':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'ABGESCHLOSSEN':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'GEBUCHT':
      return 'Gebucht'
    case 'FREI':
      return 'Frei'
    case 'KURZFRISTIG_FREI':
      return 'Kurzfristig frei'
    case 'ABGESAGT':
      return 'Abgesagt'
    case 'ABGESCHLOSSEN':
      return 'Abgeschlossen'
    default:
      return status
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<string | null>(null)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=/appointments')
      return
    }

    if (user.role !== 'PATIENT') {
      router.push('/dashboard')
      return
    }

    const loadAppointments = async () => {
      try {
        setLoading(true)
        const response = await appointmentsApi.getMy()
        const data = Array.isArray(response.data) ? response.data : []
        
        // Sort by date and time, most recent first
        const sorted = data.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(`${a.datum}T${a.uhrzeit}`)
          const dateB = new Date(`${b.datum}T${b.uhrzeit}`)
          return dateB.getTime() - dateA.getTime()
        })
        
        setAppointments(sorted)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Termine konnten nicht geladen werden')
      } finally {
        setLoading(false)
      }
    }

    void loadAppointments()
  }, [token, user, router])

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Möchten Sie diesen Termin wirklich absagen?')) return

    setCancelling(appointmentId)
    try {
      await appointmentsApi.cancel(appointmentId)
      // Update local state
      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: 'ABGESAGT' } : apt
        )
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Fehler beim Absagen des Termins')
    } finally {
      setCancelling(null)
    }
  }

  const handleRescheduleAppointment = async (appointmentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId)
    if (!appointment) return

    setSelectedAppointment(appointment)
    setRescheduleModalOpen(true)
  }

  const handleConfirmReschedule = async (datum: string, uhrzeit: string) => {
    if (!selectedAppointment) return

    setRescheduling(selectedAppointment.id)
    try {
      const response = await appointmentsApi.reschedule(selectedAppointment.id, {
        datum,
        uhrzeit,
      })

      const updated = response.data
      setAppointments(
        appointments.map((apt) =>
          apt.id === selectedAppointment.id
            ? {
                ...apt,
                datum: updated.datum,
                uhrzeit: updated.uhrzeit,
              }
            : apt
        )
      )
      setRescheduleModalOpen(false)
      setSelectedAppointment(null)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Fehler beim Verschieben des Termins')
    } finally {
      setRescheduling(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Lade Termine...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Meine Termine</h1>
            <Link
              href="/search"
              className="inline-flex items-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Neuen Termin suchen
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {appointments.length === 0 ? (
            <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Keine Termine vorhanden</h2>
              <p className="text-gray-600 mb-6">Sie haben noch keine Termine gebucht.</p>
              <Link
                href="/search"
                className="inline-flex items-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 font-medium transition-colors"
              >
                Jetzt Termin suchen
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const appointmentDateTime = new Date(`${appointment.datum}T${appointment.uhrzeit}`)
                const isUpcoming = appointmentDateTime > new Date()
                
                return (
                  <div
                    key={appointment.id}
                    className={`bg-white shadow-lg rounded-xl p-6 border ${
                      isUpcoming ? 'border-purple-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.practice.name}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="font-medium">{formatDate(appointment.datum)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {formatTime(appointment.uhrzeit)} Uhr ({appointment.dauer} Min.)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span>{appointment.therapist.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-600"
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
                            <span>
                              {appointment.practice.adresse}, {appointment.practice.plz}{' '}
                              {appointment.practice.stadt}
                            </span>
                          </div>

                          {appointment.practice.telefon && (
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <a
                                href={`tel:${appointment.practice.telefon}`}
                                className="text-purple-700 hover:underline"
                              >
                                {appointment.practice.telefon}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/practices/${appointment.practice.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-purple-200 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          Praxisdetails
                        </Link>
                        {isUpcoming && appointment.status !== 'ABGESAGT' && (
                          <button
                            onClick={() => handleRescheduleAppointment(appointment.id)}
                            disabled={rescheduling === appointment.id}
                            className="inline-flex items-center justify-center rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rescheduling === appointment.id ? 'Wird verschoben...' : 'Termin verschieben'}
                          </button>
                        )}
                        {isUpcoming && appointment.status !== 'ABGESAGT' && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancelling === appointment.id}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelling === appointment.id ? 'Wird abgesagt...' : '❌ Absagen'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false)
          setSelectedAppointment(null)
        }}
        onConfirm={handleConfirmReschedule}
        currentDate={selectedAppointment?.datum || ''}
        currentTime={selectedAppointment?.uhrzeit || ''}
        loading={!!rescheduling}
      />
    </div>
  )
}
