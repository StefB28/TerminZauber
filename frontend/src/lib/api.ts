import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
};

// Search API
export const searchApi = {
  searchSlots: (params: {
    plz?: string;
    ort?: string;
    date?: string;
    radius?: number;
    treatments?: string[];
    includeWithoutSlots?: boolean;
  }) =>
    api.get('/search/available-slots', { params }),
  getNearestSlots: (plz: string) => api.get('/search/nearest', { params: { plz } }),
  getTreatmentTypes: () => api.get('/search/treatment-types'),
};

// Practices API
export const practicesApi = {
  create: (data: any) => api.post('/practices', data),
  get: (id: string) => api.get(`/practices/${id}`),
  update: (id: string, data: any) => api.patch(`/practices/${id}`, data),
  getStatistics: (id: string) => api.get(`/practices/${id}/statistics`),
};

// Therapists API
export const therapistsApi = {
  create: (data: any) => api.post('/therapists', data),
  getByPractice: (practiceId: string) => api.get(`/therapists/practice/${practiceId}`),
  delete: (id: string) => api.delete(`/therapists/${id}`),
};

// Appointments API
export const appointmentsApi = {
  create: (data: any) => api.post('/appointments', data),
  getMy: () => api.get('/appointments'),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
  reschedule: (id: string, data: { datum: string; uhrzeit: string; dauer?: number }) =>
    api.patch(`/appointments/${id}/reschedule`, data),
};

// Availability API
export const availabilityApi = {
  create: (data: any) => api.post('/availability', data),
  getByTherapist: (therapistId: string, fromDate?: string) =>
    api.get(`/availability/therapist/${therapistId}`, { params: { fromDate } }),
  update: (id: string, status: string) => api.patch(`/availability/${id}`, { status }),
  delete: (id: string) => api.delete(`/availability/${id}`),
};

// Payments API
export const paymentsApi = {
  subscribe: (data: { aboTyp: 'BASIS' | 'PRO'; paymentMethodId: string }) =>
    api.post('/payments/subscribe', data),
  cancelSubscription: () => api.delete('/payments/subscription'),
};

// Waitlist API
export const waitlistApi = {
  join: (data: { practiceId: string; plz: string; radius: number; wunschdatum?: string }) =>
    api.post('/waitlist/join', data),
  my: () => api.get('/waitlist/my'),
  leave: (id: string) => api.delete(`/waitlist/${id}`),
};
