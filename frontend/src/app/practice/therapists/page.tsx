'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { therapistsApi, userApi } from '@/lib/api';

type Therapist = {
  id: string;
  name: string;
  availability?: Array<{ id: string }>;
};

export default function PracticeTherapistsPage() {
  const router = useRouter();
  const [practiceId, setPracticeId] = useState<string>('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const meResponse = await userApi.getProfile();
      const me = meResponse.data;

      if (me?.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      if (!me?.practiceId) {
        setError('Kein Praxisprofil gefunden.');
        return;
      }

      setPracticeId(me.practiceId);

      const response = await therapistsApi.getByPractice(me.practiceId);
      setTherapists(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login?type=practice');
        return;
      }
      setError(err?.response?.data?.message || 'Therapeuten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !practiceId) return;

    try {
      setSubmitting(true);
      setError('');
      await therapistsApi.create({
        practiceId,
        name: newName.trim(),
      });
      setNewName('');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Therapeut konnte nicht erstellt werden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Therapeut wirklich löschen?')) return;

    try {
      await therapistsApi.delete(id);
      setTherapists((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Therapeut konnte nicht gelöscht werden');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Therapeuten verwalten</h1>
            <p className="text-slate-600 mt-1">Fügen Sie Teammitglieder hinzu oder entfernen Sie sie.</p>
          </div>
          <Link href="/practice/dashboard" className="text-blue-600 hover:underline">
            Zurück zum Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Neuer Therapeut</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. Anna Müller"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Speichert...' : 'Hinzufügen'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-600">Lädt Therapeuten...</div>
          ) : therapists.length === 0 ? (
            <div className="p-6 text-slate-600">Noch keine Therapeuten vorhanden.</div>
          ) : (
            <ul>
              {therapists.map((therapist) => (
                <li key={therapist.id} className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{therapist.name}</p>
                    <p className="text-sm text-slate-500">
                      {therapist.availability?.length || 0} zukünftige Verfügbarkeiten
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDelete(therapist.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
