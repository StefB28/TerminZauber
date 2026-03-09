'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
  passwordConfirm?: string;
  telefon?: string;
  plz?: string;
  general?: string;
}

export default function ClientRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [userType, setUserType] = useState<'patient' | 'practice'>(
    (searchParams.get('type') as any) || 'patient'
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
    telefon: '',
    plz: '',
    practiceName: '',
    adresse: '',
    stadt: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Gültige E-Mail-Adresse erforderlich';
    }

    if (!formData.name) {
      newErrors.name = 'Name ist erforderlich';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name muss mindestens 2 Zeichen lang sein';
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwort-Bestätigung ist erforderlich';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwörter stimmen nicht überein';
    }

    if (userType === 'patient') {
      if (!formData.telefon) {
        newErrors.telefon = 'Telefonnummer ist erforderlich';
      }
      if (!formData.plz) {
        newErrors.plz = 'Postleitzahl ist erforderlich';
      } else if (!/^\d{5}$/.test(formData.plz)) {
        newErrors.plz = 'Postleitzahl muss 5 Ziffern haben';
      }
    }

    if (userType === 'practice') {
      if (!formData.practiceName) {
        newErrors.general = 'Praxisname ist erforderlich';
      }
      if (!formData.adresse) {
        newErrors.general = 'Adresse ist erforderlich';
      }
      if (!formData.plz) {
        newErrors.plz = 'Postleitzahl ist erforderlich';
      } else if (!/^\d{5}$/.test(formData.plz)) {
        newErrors.plz = 'Postleitzahl muss 5 Ziffern haben';
      }
      if (!formData.stadt) {
        newErrors.general = 'Stadt ist erforderlich';
      }
      if (!formData.telefon) {
        newErrors.telefon = 'Telefonnummer ist erforderlich';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authApi.register({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        telefon: formData.telefon || undefined,
        plz: formData.plz || undefined,
        role: userType === 'patient' ? 'PATIENT' : 'ADMIN',
        ...(userType === 'practice' && {
          practiceName: formData.practiceName,
          adresse: formData.adresse,
          stadt: formData.stadt,
        }),
      });

      // Store auth data
      setAuth(response.data.user, response.data.access_token);

      // Redirect based on user type
      if (userType === 'patient') {
        router.push('/dashboard');
      } else {
        router.push('/practice/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registrierung fehlgeschlagen';
      setErrors({
        general: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium shadow-lg">
        ⚡ Starten Sie jetzt mit TerminZauber
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-3xl sm:text-4xl font-bold font-handwriting bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                TerminZauber
              </h1>
            </Link>
            <p className="text-gray-600">
              {userType === 'patient' ? 'Patient Registrierung' : 'Praxis Registrierung'}
            </p>
          </div>

          {/* User Type Selection */}
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setUserType('patient')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                userType === 'patient'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-600'
              }`}
            >
              👤 Patient
            </button>
            <button
              onClick={() => setUserType('practice')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                userType === 'practice'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-600'
              }`}
            >
              🏥 Praxis
            </button>
          </div>

          {/* Registration Form */}
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-white/20">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="max@example.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vollständiger Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Max Mustermann"
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Practice Name (Practice only) */}
              {userType === 'practice' && (
                <div>
                  <label htmlFor="practiceName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Praxisname *
                  </label>
                  <input
                    id="practiceName"
                    type="text"
                    name="practiceName"
                    value={formData.practiceName}
                    onChange={handleChange}
                    placeholder="z.B. Physiotherapie Mustermann"
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                      errors.general
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              {/* Practice Address (Practice only) */}
              {userType === 'practice' && (
                <div>
                  <label htmlFor="adresse" className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    id="adresse"
                    type="text"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Musterstraße 123"
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                      errors.general
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              {/* Postleitzahl (for both) */}
              {(userType === 'patient' || userType === 'practice') && (
                <div>
                  <label htmlFor="plz" className="block text-sm font-semibold text-gray-700 mb-2">
                    Postleitzahl *
                  </label>
                  <input
                    id="plz"
                    type="text"
                    name="plz"
                    value={formData.plz}
                    onChange={handleChange}
                    placeholder="10115"
                    maxLength={5}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                      errors.plz
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    disabled={loading}
                    required
                  />
                  {errors.plz && (
                    <p className="mt-2 text-sm text-red-600">{errors.plz}</p>
                  )}
                </div>
              )}

              {/* City (Practice only) */}
              {userType === 'practice' && (
                <div>
                  <label htmlFor="stadt" className="block text-sm font-semibold text-gray-700 mb-2">
                    Stadt *
                  </label>
                  <input
                    id="stadt"
                    type="text"
                    name="stadt"
                    value={formData.stadt}
                    onChange={handleChange}
                    placeholder="Berlin"
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                      errors.general
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                    }`}
                    disabled={loading}
                    required
                  />
                </div>
              )}

              {/* Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  id="telefon"
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  placeholder="030 123456"
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.telefon
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  disabled={loading}
                  required
                />
                {errors.telefon && (
                  <p className="mt-2 text-sm text-red-600">{errors.telefon}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mindestens 8 Zeichen"
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Password Confirmation */}
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Passwort wiederholen
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="Passwort bestätigen"
                  className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                    errors.passwordConfirm
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  disabled={loading}
                />
                {errors.passwordConfirm && (
                  <p className="mt-2 text-sm text-red-600">{errors.passwordConfirm}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? 'Wird registriert...' : 'Registrieren'}
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-600 mt-6">
                Bereits registriert?{' '}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Hier anmelden
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
