'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { practicesApi, userApi } from '@/lib/api';

interface Practice {
  id: string;
  name: string;
  email: string;
  stadt: string;
  plz: string;
  aboStatus: string;
  aboTyp: string;
}

interface DashboardStats {
  totalTherapists?: number;
  totalAvailableSlots?: number;
  upcomingAppointments?: number;
}

export default function PracticeDashboard() {
  const router = useRouter();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPracticeData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?type=practice');
          return;
        }

        const meResponse = await userApi.getProfile();
        const me = meResponse.data;

        if (!me?.practiceId) {
          setError('Kein Praxisprofil gefunden. Bitte erstellen Sie zuerst eine Praxis.');
          return;
        }

        const practiceResponse = await practicesApi.get(me.practiceId);
        setPractice(practiceResponse.data);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push('/login?type=practice');
          return;
        }
        setError('Fehler beim Verbinden mit dem Server');
      } finally {
        setLoading(false);
      }
    };

    loadPracticeData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Lädt Praxis-Daten...</p>
        </div>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Fehler</h1>
          <p className="text-slate-600 mb-6">{error || 'Praxis konnte nicht geladen werden'}</p>
          <Link
            href="/login?type=practice"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{practice.name}</h1>
              <p className="mt-1 text-slate-600">
                {practice.plz} {practice.stadt}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`px-4 py-2 rounded-full font-semibold text-white ${
                  practice.aboStatus === 'ACTIVE'
                    ? 'bg-green-500'
                    : practice.aboStatus === 'SUSPENDED'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
                }`}
              >
                {practice.aboStatus === 'ACTIVE'
                  ? '✅ Aktiv'
                  : practice.aboStatus === 'SUSPENDED'
                    ? '⚠️ Gesperrt'
                    : 'ℹ️ Inaktiv'}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Plan: <span className="font-semibold">{practice.aboTyp}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {practice.aboStatus !== 'ACTIVE' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              {practice.aboStatus === 'INACTIVE'
                ? '⚠️ Ihre Praxis ist nicht für Patienten sichtbar. Bitte aktivieren Sie ein Abonnement.'
                : '⚠️ Ihr Abonnement ist ausgesetzt. Bitte kontrollieren Sie Ihre Zahlungsmethode.'}
            </p>
            <Link
              href="/practice/subscription"
              className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Zur Abonnement-Verwaltung
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Abonnement */}
          <Link href="/practice/subscription">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-2">
                {practice.aboStatus === 'ACTIVE' ? '✅' : '🔐'}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Abonnement</h3>
              <p className="text-sm text-slate-600 mt-2">
                {practice.aboStatus === 'ACTIVE'
                  ? `${practice.aboTyp} - Aktiv`
                  : 'Plan auswählen'}
              </p>
            </div>
          </Link>

          {/* Therapeuten */}
          <Link href="/practice/therapists">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-2">👨‍⚕️</div>
              <h3 className="text-lg font-semibold text-slate-900">Therapeuten</h3>
              <p className="text-sm text-slate-600 mt-2">Verwalten & hinzufügen</p>
            </div>
          </Link>

          {/* Verfügbarkeiten */}
          <Link href="/practice/availability">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="text-lg font-semibold text-slate-900">Verfügbarkeiten</h3>
              <p className="text-sm text-slate-600 mt-2">Termine eintragen</p>
            </div>
          </Link>

          {/* Buchungen */}
          <Link href="/practice/appointments">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="text-lg font-semibold text-slate-900">Buchungen</h3>
              <p className="text-sm text-slate-600 mt-2">Alle Termine</p>
            </div>
          </Link>
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Getting Started */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">🚀 Erste Schritte</h2>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Abonnement wählen</p>
                  <p className="text-sm text-slate-600">BASIS (5€) oder PRO (15€) pro Monat</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Therapeuten hinzufügen</p>
                  <p className="text-sm text-slate-600">
                    Erstellen Sie Profile für jede/n Therapeut/in
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Verfügbarkeiten eintragen</p>
                  <p className="text-sm text-slate-600">
                    Arbeitszeiten und Pausen konfigurieren
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Patienten buchen</p>
                  <p className="text-sm text-slate-600">
                    Ihre Praxis erscheint in der Suche
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">ℹ️ Wichtig</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900">Nur Praxen zahlen</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Patienten können kostenlos Termine buchen. Nur die Praxis bezahlt das
                  Abonnement.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Sicher & verschlüsselt</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Zahlungen werden über Stripe abgewickelt - einen der sichersten
                  Payment-Provider.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Jederzeit kündbar</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Sie können Ihr Abonnement jederzeit beenden, ohne Bindung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              Fragen?{' '}
              <a href="mailto:support@physiomatch.de" className="text-blue-600 hover:underline">
                Kontaktieren Sie uns
              </a>
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login?type=practice');
              }}
              className="text-slate-600 hover:text-slate-900 underline"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
