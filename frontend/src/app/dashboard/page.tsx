'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { appointmentsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Appointment {
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
  }
  therapist: {
    id: string
    name: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'PATIENT') {
      router.push('/login')
      return
    }
    loadAppointments()
  }, [user, router])

  const loadAppointments = async () => {
    try {
      const response = await appointmentsApi.getMy()
      const data = Array.isArray(response.data) ? response.data : []
      setAppointments(data)
    } catch (error) {
      console.error('Fehler beim Laden der Termine', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (id: string) => {
    if (!confirm('Möchten Sie diesen Termin wirklich absagen?')) return

    try {
      await appointmentsApi.cancel(id)
      await loadAppointments()
      alert('Termin abgesagt')
    } catch (error) {
      alert('Fehler beim Absagen')
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = appointments.filter((apt) => new Date(`${apt.datum}T${apt.uhrzeit}`) > now)
    const completed = appointments.filter((apt) => apt.status === 'ABGESCHLOSSEN')
    return {
      total: appointments.length,
      upcoming: upcoming.length,
      completed: completed.length,
    }
  }, [appointments])

  const upcomingAppointments = appointments
    .filter((apt) => new Date(`${apt.datum}T${apt.uhrzeit}`) > new Date())
    .sort(
      (a, b) =>
        new Date(`${a.datum}T${a.uhrzeit}`).getTime() -
        new Date(`${b.datum}T${b.uhrzeit}`).getTime()
    )
    .slice(0, 3)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              PhysioMatch
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-700 font-medium hidden sm:inline">👋 Hallo, {user?.name}</span>
            <button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 underline text-sm"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-slate-900">Willkommen zurück, {user?.name}! 👋</h2>
              <p className="text-slate-600 mt-2">Hier findest du all deine gebuchten Termine und Informationen</p>
            </div>
            <Link
              href="/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
            >
              + Neuen Termin suchen
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Gesamt Termine</p>
                  <p className="text-4xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <span className="text-5xl">📅</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Zukünftige Termine</p>
                  <p className="text-4xl font-bold text-slate-900 mt-2">{stats.upcoming}</p>
                </div>
                <span className="text-5xl">⏰</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Abgeschlossen</p>
                  <p className="text-4xl font-bold text-slate-900 mt-2">{stats.completed}</p>
                </div>
                <span className="text-5xl">✅</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">📋 Nächste Termine</h3>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-3">Lädt deine Termine...</p>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-slate-600 mb-4">📭 Du hast aktuell keine anstehenden Termine</p>
                <Link
                  href="/search"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Jetzt Termin suchen
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900">{appointment.practice.name}</h4>
                        <p className="text-slate-600 mt-1">👨‍⚕️ {appointment.therapist.name}</p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Datum</p>
                            <p className="text-slate-900 font-semibold">
                              {formatDate(appointment.datum)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Zeit</p>
                            <p className="text-slate-900 font-semibold">
                              {formatTime(appointment.uhrzeit)} Uhr ({appointment.dauer} min)
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mt-3">
                          📍 {appointment.practice.plz} {appointment.practice.stadt}
                        </p>
                      </div>

                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                      >
                        ❌ Absagen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {appointments.length > 3 && (
              <div className="mt-6">
                <Link
                  href="/appointments"
                  className="inline-block text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  → Alle Termine anzeigen ({appointments.length})
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">⚡ Quick Links</h3>

            <div className="space-y-3">
              <Link
                href="/search"
                className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <p className="text-2xl mb-2">🔍</p>
                <p className="font-semibold text-slate-900">Praxis suchen</p>
                <p className="text-xs text-slate-600 mt-1">Finde Praxen in deiner Nähe</p>
              </Link>

              <Link
                href="/appointments"
                className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              >
                <p className="text-2xl mb-2">📅</p>
                <p className="font-semibold text-slate-900">Meine Termine</p>
                <p className="text-xs text-slate-600 mt-1">Alle gebuchten Termine</p>
              </Link>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 border border-blue-200">
                <p className="text-lg mb-2">💡</p>
                <p className="font-semibold text-slate-900">Tipp</p>
                <p className="text-xs text-slate-700 mt-2">
                  Du kannst Termine bis 24 Stunden vor dem Termin absagen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
