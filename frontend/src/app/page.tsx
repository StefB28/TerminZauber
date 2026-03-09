'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [plz, setPlz] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showPatientMenu, setShowPatientMenu] = useState(false)
  const [showPraxisMenu, setShowPraxisMenu] = useState(false)
  const { user, token } = useAuthStore()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !user) {
      router.push('/login?redirect=/search')
      return
    }
    const trimmed = plz.trim()
    const isPostalCode = /^\d{5}$/.test(trimmed)
    const param = isPostalCode ? `plz=${trimmed}` : `ort=${encodeURIComponent(trimmed)}`
    router.push(`/search?${param}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* Top Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium shadow-lg">
        ⚡ Finde kurzfristige Physiotherapie-Termine in deiner Nähe
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">

          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm tracking-tight font-handwriting">
                TerminZauber
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 items-center">
            {/* Patient Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowPatientMenu(true)}
                onMouseLeave={() => setShowPatientMenu(false)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base"
              >
                👤 Patient
              </button>
              {showPatientMenu && (
                <div
                  onMouseEnter={() => setShowPatientMenu(true)}
                  onMouseLeave={() => setShowPatientMenu(false)}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  <Link
                    href="/login?type=patient"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href="/register?type=patient"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    Registrieren
                  </Link>
                </div>
              )}
            </div>

            {/* Praxis Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowPraxisMenu(true)}
                onMouseLeave={() => setShowPraxisMenu(false)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base"
              >
                🏥 Praxis
              </button>
              {showPraxisMenu && (
                <div
                  onMouseEnter={() => setShowPraxisMenu(true)}
                  onMouseLeave={() => setShowPraxisMenu(false)}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  <Link
                    href="/login?type=practice"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href="/register?type=practice"
                    className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  >
                    Registrieren
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
              <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
            </div>
          </button>

        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="container mx-auto px-4 py-4 space-y-3">
              {/* Patient Section */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">👤 Patient</p>
                <Link
                  href="/login?type=patient"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register?type=patient"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-center"
                >
                  Registrieren
                </Link>
              </div>

              {/* Praxis Section */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700">🏥 Praxis</p>
                <Link
                  href="/login?type=practice"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                >
                  Anmelden
                </Link>
                <Link
                  href="/register?type=practice"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-center"
                >
                  Registrieren
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-24 text-center">

        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight drop-shadow-sm font-heading">
          Physiotherapie-Termin <br className="hidden sm:block"/> sofort finden
        </h2>

        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12 font-light px-4" style={{ fontFamily: "'Fauna One', serif" }}>
          Finde freie Termine bei Physiotherapien in deiner Nähe.
          Schnell, unkompliziert und ohne lange Wartezeiten.
        </p>

        {/* Big Search */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto mb-12 sm:mb-16 border border-white/20">

          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" style={{ fontFamily: "'Cinzel', serif" }}>
            Termin in deiner Nähe finden
          </h3>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">

            <input
              type="text"
              placeholder="PLZ oder Ort eingeben"
              className="flex-1 border border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm bg-gray-50/50"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              required
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
            >
              Suchen
            </button>

          </form>

        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">

          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:transform hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Schnell suchen
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Gib deine PLZ oder Stadt ein und finde sofort verfügbare Termine.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:transform hover:-translate-y-1">
            <div className="text-4xl sm:text-5xl mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Kurzfristige Termine
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Nutze frei gewordene Termine durch kurzfristige Absagen.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="text-4xl sm:text-5xl mb-4">✅</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Direkt buchen
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Sichere dir deinen Termin direkt online.
            </p>
          </div>

        </div>

        {/* Praxis CTA */}
        <div className="mt-16 sm:mt-20 lg:mt-24 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto shadow-xl">

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Für Physiotherapie-Praxen
          </h3>

          <p className="text-gray-700 mb-6 text-sm sm:text-base">
            Fülle kurzfristige Terminlücken automatisch und gewinne neue Patienten.
          </p>

          <Link
            href="/register?type=practice"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-block"
          >
            Praxis registrieren
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 sm:py-10 text-center text-gray-600 bg-white/50 backdrop-blur-sm px-4">

        <p className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent text-lg sm:text-xl">
          TerminZauber
        </p>

        <p className="mt-2 text-sm sm:text-base">
          &copy; 2026 TerminZauber • Made with ❤️ by Stefanie
        </p>

        <p className="text-xs sm:text-sm mt-2 space-x-4">
          <span>DSGVO-konform</span>
          <span>•</span>
          <span>Datenschutz</span>
          <span>•</span>
          <span>Impressum</span>
        </p>

      </footer>

    </div>
  )
}
