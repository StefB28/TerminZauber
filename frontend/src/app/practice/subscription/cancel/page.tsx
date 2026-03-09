'use client';

import Link from 'next/link';

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <svg
            className="w-16 h-16 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Zahlung abgebrochen</h1>
        <p className="text-slate-600 mb-6">
          Sie haben das Checkout beendet. Ihre Praxis wurde nicht aktiviert.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-900">
            Sie können jederzeit zurück zu den Abos und einen Plan wählen.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/practice/subscription"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Zu den Abos zurück
          </Link>
          <Link
            href="/practice/dashboard"
            className="block w-full py-3 px-4 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
          >
            Zum Dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Probleme? <a href="mailto:support@physiomatch.de" className="text-blue-600 hover:underline">
            Kontaktieren Sie uns
          </a>
        </p>
      </div>
    </div>
  );
}
