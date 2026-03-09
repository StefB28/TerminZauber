'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appointmentsApi, userApi } from '@/lib/api';
import RescheduleModal from '@/components/RescheduleModal';

type Appointment = {
  id: string;
  datum: string;
  uhrzeit: string;
  dauer: number;
  status: string;
  therapist: {
    id: string;
    name: string;
  };
  patient: {
    name: string;
    email: string;
    telefon?: string | null;
  };
};

export default function PracticeAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const meResponse = await userApi.getProfile();
      const me = meResponse.data;

      if (me?.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      const response = await appointmentsApi.getMy();
      const data = Array.isArray(response.data) ? response.data : [];
      setAppointments(data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login?type=practice');
        return;
      }
      setError(err?.response?.data?.message || 'Buchungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

  const grouped = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter((a) => new Date(`${a.datum}T${a.uhrzeit}`) >= now);
    const past = appointments.filter((a) => new Date(`${a.datum}T${a.uhrzeit}`) < now);
    return { upcoming, past };
  }, [appointments]);

  const handleCancel = async (id: string) => {
    if (!confirm('Termin wirklich absagen?')) return;
    try {
      await appointmentsApi.cancel(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ABGESAGT' } : a)));
    } catch {
      setError('Termin konnte nicht abgesagt werden');
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = async (datum: string, uhrzeit: string) => {
    if (!selectedAppointment) return;

    setRescheduling(selectedAppointment.id);
    try {
      const response = await appointmentsApi.reschedule(selectedAppointment.id, {
        datum,
        uhrzeit,
      });

      const updated = response.data;
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === selectedAppointment.id
            ? { ...a, datum: updated.datum, uhrzeit: updated.uhrzeit }
            : a
        )
      );
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Termin konnte nicht verschoben werden');
    } finally {
      setRescheduling(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patienten-Buchungen</h1>
            <p className="text-slate-600 mt-1">Übersicht über eingehende und vergangene Termine.</p>
          </div>
          <Link href="/practice/dashboard" className="text-blue-600 hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-600">Lädt Buchungen...</div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Zukünftige Termine ({grouped.upcoming.length})</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {grouped.upcoming.length === 0 ? (
                  <div className="p-6 text-slate-600">Keine zukünftigen Buchungen.</div>
                ) : (
                  <ul>
                    {grouped.upcoming.map((a) => (
                      <li key={a.id} className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {new Date(a.datum).toLocaleDateString('de-DE')} | {a.uhrzeit.substring(0, 5)} Uhr
                          </p>
                          <p className="text-sm text-slate-600">Therapeut: {a.therapist.name}</p>
                          <p className="text-sm text-slate-600">Patient: {a.patient.name}</p>
                          <p className="text-sm text-slate-600">
                            Kontakt: {a.patient.email}{a.patient.telefon ? ` | ${a.patient.telefon}` : ''}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Status: {a.status}</p>
                        </div>
                        {a.status !== 'ABGESAGT' && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleReschedule(a)}
                              disabled={rescheduling === a.id}
                              className="rounded-lg border border-amber-200 px-3 py-2 text-amber-700 hover:bg-amber-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rescheduling === a.id ? 'Wird verschoben...' : 'Verschieben'}
                            </button>
                            <button
                              onClick={() => void handleCancel(a.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50 text-sm"
                            >
                              Absagen
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Vergangene Termine ({grouped.past.length})</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {grouped.past.length === 0 ? (
                  <div className="p-6 text-slate-600">Keine vergangenen Termine.</div>
                ) : (
                  <ul>
                    {grouped.past.map((a) => (
                      <li key={a.id} className="p-4 border-b border-slate-100">
                        <p className="font-semibold text-slate-900">
                          {new Date(a.datum).toLocaleDateString('de-DE')} | {a.uhrzeit.substring(0, 5)} Uhr
                        </p>
                        <p className="text-sm text-slate-600">Therapeut: {a.therapist.name}</p>
                        <p className="text-sm text-slate-600">Patient: {a.patient.name}</p>
                        <p className="text-xs text-slate-500 mt-1">Status: {a.status}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirmReschedule}
        currentDate={selectedAppointment?.datum || ''}
        currentTime={selectedAppointment?.uhrzeit || ''}
        loading={!!rescheduling}
      />
    </div>
  );
}
