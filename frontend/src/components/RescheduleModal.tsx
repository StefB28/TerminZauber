'use client'

import { useState, useEffect } from 'react'

type RescheduleModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (datum: string, uhrzeit: string) => void
  currentDate: string
  currentTime: string
  loading: boolean
}

export default function RescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  currentTime,
  loading,
}: RescheduleModalProps) {
  const [datum, setDatum] = useState(currentDate)
  const [uhrzeit, setUhrzeit] = useState(currentTime.substring(0, 5))

  useEffect(() => {
    if (isOpen) {
      setDatum(currentDate)
      setUhrzeit(currentTime.substring(0, 5))
    }
  }, [isOpen, currentDate, currentTime])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datum || !uhrzeit) {
      alert('Bitte Datum und Uhrzeit auswählen')
      return
    }
    onConfirm(datum, `${uhrzeit}:00`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Termin verschieben</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
                  Neues Datum
                </label>
                <input
                  type="date"
                  id="datum"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label htmlFor="uhrzeit" className="block text-sm font-medium text-gray-700 mb-1">
                  Neue Uhrzeit
                </label>
                <input
                  type="time"
                  id="uhrzeit"
                  value={uhrzeit}
                  onChange={(e) => setUhrzeit(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium mb-1">Hinweis</p>
                <p>
                  Aktueller Termin: {new Date(currentDate).toLocaleDateString('de-DE')} um{' '}
                  {currentTime.substring(0, 5)} Uhr
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird verschoben...' : 'Termin verschieben'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
