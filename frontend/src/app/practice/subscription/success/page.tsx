'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('Keine Session ID vorhanden');
        }

        // Optional: Session auf dem Backend verifizieren
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Subscription konnte nicht bestätigt werden');
        }
      } catch (err) {
        console.error('Fehler:', err);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <svg
            className="w-16 h-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Zahlung erfolgreich!</h1>
        <p className="text-slate-600 mb-6">
          Vielen Dank! Ihr Abonnement wurde aktiviert. Ihre Praxis ist jetzt sichtbar für
          Patienten.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            ✅ Praxis aktiviert<br />
            ✅ Therapisten verwalten<br />
            ✅ Verfügbarkeiten eintragen<br />
            ✅ Auf Buchungen warten
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/practice/dashboard"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Zum Dashboard
          </Link>
          <Link
            href="/practice/subscription"
            className="block w-full py-3 px-4 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300"
          >
            Abo verwalten
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Fragen? <a href="mailto:support@physiomatch.de" className="text-blue-600 hover:underline">
            support@physiomatch.de
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Verifying payment...</p>
          </div>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
