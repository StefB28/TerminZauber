import * as request from 'supertest';

describe('Patient Flow E2E (API)', () => {
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:4000/api';

  it('rejects patient registration without phone number', async () => {
    const now = Date.now();
    const response = await request(baseUrl)
      .post('/auth/register')
      .send({
        email: `e2e.patient.nophone.${now}@example.com`,
        name: `E2E Patient ${now}`,
        password: 'Passw0rd123X',
        role: 'PATIENT',
        plz: '10115',
      });

    expect(response.status).toBe(400);
  });

  it('registers practice with full address and links admin to practice', async () => {
    const now = Date.now();
    const registerResponse = await request(baseUrl)
      .post('/auth/register')
      .send({
        email: `e2e.practice.${now}@example.com`,
        name: `E2E Practice Admin ${now}`,
        password: 'Passw0rd123X',
        telefon: '030123456',
        plz: '10115',
        stadt: 'Berlin',
        adresse: 'E2E Strasse 1',
        practiceName: `E2E Praxis ${now}`,
        role: 'ADMIN',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body?.access_token).toBeDefined();

    const meResponse = await request(baseUrl)
      .get('/users/me')
      .set('Authorization', `Bearer ${registerResponse.body.access_token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body?.practiceId).toBeTruthy();
    expect(meResponse.body?.practice?.name).toContain('E2E Praxis');
  });

  it('supports search by city and postcode', async () => {
    const cityResponse = await request(baseUrl).get('/search/available-slots').query({
      ort: 'Berlin',
      radius: 20,
    });

    const plzResponse = await request(baseUrl).get('/search/available-slots').query({
      plz: '10115',
      radius: 20,
    });

    expect(cityResponse.status).toBe(200);
    expect(Array.isArray(cityResponse.body)).toBe(true);

    expect(plzResponse.status).toBe(200);
    expect(Array.isArray(plzResponse.body)).toBe(true);
  });

  it('allows booking and rescheduling by patient and practice', async () => {
    const now = Date.now();

    const patientRegister = await request(baseUrl)
      .post('/auth/register')
      .send({
        email: `e2e.flow.patient.${now}@example.com`,
        name: `E2E Flow Patient ${now}`,
        password: 'Passw0rd123X',
        telefon: '0176123456',
        plz: '10115',
        role: 'PATIENT',
      });
    expect(patientRegister.status).toBe(201);

    const adminRegister = await request(baseUrl)
      .post('/auth/register')
      .send({
        email: `e2e.flow.admin.${now}@example.com`,
        name: `E2E Flow Admin ${now}`,
        password: 'Passw0rd123X',
        telefon: '030123456',
        plz: '10115',
        stadt: 'Berlin',
        adresse: 'E2E Flow Strasse 1',
        practiceName: `E2E Flow Praxis ${now}`,
        role: 'ADMIN',
      });
    expect(adminRegister.status).toBe(201);

    const patientToken = patientRegister.body.access_token as string;
    const adminToken = adminRegister.body.access_token as string;

    const meResponse = await request(baseUrl)
      .get('/users/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(meResponse.status).toBe(200);

    const practiceId = meResponse.body.practiceId as string;
    expect(practiceId).toBeTruthy();

    const therapistResponse = await request(baseUrl)
      .post('/therapists')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Therapist' });
    expect(therapistResponse.status).toBe(201);

    const therapistId = therapistResponse.body.id as string;

    const bookingResponse = await request(baseUrl)
      .post('/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        practiceId,
        therapistId,
        datum: '2026-03-20',
        uhrzeit: '10:00:00',
        dauer: 30,
      });

    expect(bookingResponse.status).toBe(201);
    const appointmentId = bookingResponse.body.id as string;

    const patientReschedule = await request(baseUrl)
      .patch(`/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ datum: '2026-03-21', uhrzeit: '11:30:00' });

    expect(patientReschedule.status).toBe(200);

    const practiceReschedule = await request(baseUrl)
      .patch(`/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ datum: '2026-03-22', uhrzeit: '12:30:00' });

    expect(practiceReschedule.status).toBe(200);
    expect(practiceReschedule.body?.id).toBe(appointmentId);
  });
});
