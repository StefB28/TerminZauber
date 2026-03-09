'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionPlan {
  name: string;
  type: 'BASIS' | 'PRO';
  price: number;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    name: 'BASIS',
    type: 'BASIS',
    price: 5,
    features: [
      'Unbegrenzte Terminanfragen',
      'Patientenverwaltung',
      'Verfügbarkeitskalender',
      'Grundstatistiken',
    ],
    cta: 'BASIS wählen',
  },
  {
    name: 'PRO',
    type: 'PRO',
    price: 15,
    features: [
      'Alles aus BASIS',
      'Erweiterte Statistiken',
      'Terminserien',
      'API-Zugang',
      'Priority Support',
    ],
    cta: 'PRO wählen',
    highlighted: true,
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Aktuelle Subscription laden
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSubscription(data);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Subscription:', err);
      }
    };

    fetchSubscription();
  }, []);

  const handleSubscribe = async (aboTyp: 'BASIS' | 'PRO') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?type=practice');
        return;
      }

      // Checkout Session erstellen
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ aboTyp }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Erstellen der Checkout Session');
      }

      const { url } = await response.json();

      // Zu Stripe Checkout weitergeleitet
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Möchten Sie Ihr Abonnement wirklich beenden?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/subscription`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Abonnement wurde gekündigt');
        setCurrentSubscription(null);
      }
    } catch (err) {
      alert('Fehler beim Kündigen des Abonnements');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900">Abonnement-Pläne</h1>
          <p className="mt-2 text-lg text-slate-600">
            Wählen Sie einen Plan, um Ihre Praxis auf PhysioMatch zu aktivieren
          </p>
        </div>
      </div>

      {/* Aktuelles Abonnement */}
      {currentSubscription && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-900">
                  Aktuelles Abonnement: {currentSubscription.aboTyp}
                </h2>
                <p className="mt-2 text-blue-700">
                  Status: <span className="font-semibold">{currentSubscription.status}</span>
                </p>
                <p className="text-blue-700">
                  Gültig bis:{' '}
                  <span className="font-semibold">
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('de-DE')}
                  </span>
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Abonnement kündigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform ${
                plan.highlighted
                  ? 'ring-2 ring-blue-500 transform scale-105 bg-gradient-to-br from-blue-50 to-white'
                  : 'bg-white'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-blue-500 text-white py-2 text-center text-sm font-semibold">
                  EMPFOHLEN
                </div>
              )}

              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>

                <div className="mt-4">
                  <span className="text-5xl font-bold text-slate-900">{plan.price}€</span>
                  <span className="text-slate-600 ml-2">/Monat</span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-slate-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.type)}
                  disabled={loading}
                  className={`w-full mt-8 py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Wird geladen...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Häufig gestellte Fragen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900">Kann ich jederzeit kündigen?</h3>
              <p className="mt-2 text-slate-600">
                Ja, Sie können Ihr Abonnement jederzeit ohne weiteres kündigen. Die Kündigung ist
                sofort wirksam.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Wie sichere ich meine Daten?</h3>
              <p className="mt-2 text-slate-600">
                Ihre Zahlung wird über Stripe verarbeitet, einen der sichersten Payment-Provider
                der Welt.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Kann ich upgraden oder downgraden?</h3>
              <p className="mt-2 text-slate-600">
                Ja, Sie können Ihren Plan jederzeit wechseln. Die Differenz wird berechnet.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Welche Zahlungsarten werden akzeptiert?</h3>
              <p className="mt-2 text-slate-600">
                Wir akzeptieren Kreditkarten und SEPA-Lastschrift.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
