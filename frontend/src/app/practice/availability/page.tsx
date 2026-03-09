'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { availabilityApi, therapistsApi, userApi } from '@/lib/api';

type Therapist = {
  id: string;
  name: string;
};

type Slot = {
  id: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  status: string;
};

export default function PracticeAvailabilityPage() {
  const router = useRouter();
  const [practiceId, setPracticeId] = useState('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadTherapists = async () => {
    const meResponse = await userApi.getProfile();
    const me = meResponse.data;

    if (me?.role !== 'ADMIN') {
      router.push('/dashboard');
      return { practiceId: '', therapists: [] as Therapist[] };
    }

    if (!me?.practiceId) {
      throw new Error('Kein Praxisprofil gefunden');
    }

    const therapistsResponse = await therapistsApi.getByPractice(me.practiceId);
    const list = Array.isArray(therapistsResponse.data) ? therapistsResponse.data : [];

    return { practiceId: me.practiceId, therapists: list };
  };

  const loadSlots = async (therapistId: string) => {
    if (!therapistId) {
      setSlots([]);
      return;
    }

    const response = await availabilityApi.getByTherapist(therapistId, today);
    const list = Array.isArray(response.data) ? response.data : [];
    setSlots(list);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await loadTherapists();
        setPracticeId(data.practiceId);
        setTherapists(data.therapists);
        const first = data.therapists[0]?.id || '';
        setSelectedTherapistId(first);
        if (first) {
          await loadSlots(first);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push('/login?type=practice');
          return;
        }
        setError(err?.message || 'Verfügbarkeiten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [router, today]);

  const onTherapistChange = async (id: string) => {
    setSelectedTherapistId(id);
    setError('');
    try {
      await loadSlots(id);
    } catch {
      setError('Slots konnten nicht geladen werden');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapistId || !date) return;

    try {
      setSaving(true);
      setError('');
      await availabilityApi.create({
        therapistId: selectedTherapistId,
        datum: date,
        startzeit: startTime,
        endzeit: endTime,
        status: 'FREI',
      });
      await loadSlots(selectedTherapistId);
      setDate('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Slot konnte nicht erstellt werden');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await availabilityApi.update(id, status);
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch {
      setError('Status konnte nicht aktualisiert werden');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Slot wirklich löschen?')) return;
    try {
      await availabilityApi.delete(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Slot konnte nicht gelöscht werden');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Verfügbarkeiten verwalten</h1>
            <p className="text-slate-600 mt-1">Pflegen Sie freie Termine Ihrer Therapeuten.</p>
          </div>
          <Link href="/practice/dashboard" className="text-blue-600 hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Neuen Slot erstellen</h2>

            {loading ? (
              <p className="text-slate-600">Lädt Therapeuten...</p>
            ) : therapists.length === 0 ? (
              <p className="text-slate-600">Bitte zuerst Therapeuten anlegen.</p>
            ) : (
              <form onSubmit={handleCreateSlot} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Therapeut</label>
                  <select
                    value={selectedTherapistId}
                    onChange={(e) => void onTherapistChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Von</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bis</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !selectedTherapistId}
                  className="w-full rounded-lg bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Speichert...' : 'Slot anlegen'}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Geplante Slots</h2>
            </div>

            {slots.length === 0 ? (
              <div className="p-6 text-slate-600">Keine Slots vorhanden.</div>
            ) : (
              <ul>
                {slots.map((slot) => (
                  <li key={slot.id} className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {new Date(slot.datum).toLocaleDateString('de-DE')} | {slot.startzeit.substring(11, 16)} - {slot.endzeit.substring(11, 16)}
                      </p>
                      <p className="text-sm text-slate-500">Status: {slot.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={slot.status}
                        onChange={(e) => void handleStatusChange(slot.id, e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="FREI">FREI</option>
                        <option value="KURZFRISTIG_FREI">KURZFRISTIG_FREI</option>
                        <option value="GEBUCHT">GEBUCHT</option>
                        <option value="ABGESAGT">ABGESAGT</option>
                      </select>
                      <button
                        onClick={() => void handleDelete(slot.id)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
