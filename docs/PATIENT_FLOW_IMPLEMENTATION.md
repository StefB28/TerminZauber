# PhysioMatch - Patient Flow Implementation Guide

## Current Status (2026-03-09)

Already live in production:
- Search accepts both postcode (`plz`) and city (`ort`).
- Homepage navigation is split into `Patient` and `Praxis` (each with login/register paths).
- Praxis registration is exposed via the dedicated CTA at the bottom of the homepage.
- Registration form includes praxis fields (`practiceName`, `adresse`, `plz`, `stadt`).
- Telephone is required for patient registration in frontend validation and backend validation.
- Appointment rescheduling is available for patient and praxis users (modal UI + backend endpoint).

Immediate rollout checks:
1. Register a new patient without phone number and confirm validation blocks submit.
2. Register a new praxis and confirm practice profile is created and linked to admin user.
3. Search with `Berlin` and with `10115` and verify both return practices.
4. Open homepage desktop/mobile and verify `Patient` / `Praxis` menus and links.
5. Book and reschedule one test appointment from patient and praxis views.

Recommended next tasks:
1. Replace blocked Outlook SMTP with a provider that supports app SMTP/API (for reliable waitlist emails).
2. Add backend e2e tests for register/search/reschedule flows.
3. Add monitoring alert on `/api/health` and failed email logs.

CI automation now available:
- GitHub Actions workflow `/.github/workflows/backend-e2e.yml` runs backend e2e tests on push/PR changes under `backend/**`.
- The workflow provisions Postgres, runs Prisma migrations, starts backend, and executes `npm run test:e2e`.

## 📋 Overview

Complete implementation roadmap for the patient journey:
**Register → Search (with filters) → Select Practice → Book Appointment → Receive Confirmation**

---

## 🗄️ **Phase 1: Database Schema Updates**

### Add Treatment Types to Prisma Schema

Add this to `backend/prisma/schema.prisma`:

```prisma
model TreatmentType {
  id            String   @id @default(cuid())
  name          String   // "Massage", "Physiotherapy", "Osteopathy", etc.
  beschreibung  String?  @db.Text
  dauer         Int      @default(30) // in Minuten

  // Relations
  therapists    TherapistSpecialty[]
  practices     PracticeSpecialty[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([name])
}

model TherapistSpecialty {
  id            String   @id @default(cuid())
  therapistId   String
  therapist     Therapist @relation(fields: [therapistId], references: [id], onDelete: Cascade)
  
  treatmentId   String
  treatment     TreatmentType @relation(fields: [treatmentId], references: [id], onDelete: Cascade)

  @@unique([therapistId, treatmentId])
}

model PracticeSpecialty {
  id            String   @id @default(cuid())
  practiceId    String
  practice      Practice @relation(fields: [practiceId], references: [id], onDelete: Cascade)
  
  treatmentId   String
  treatment     TreatmentType @relation(fields: [treatmentId], references: [id], onDelete: Cascade)

  @@unique([practiceId, treatmentId])
}
```

### Update Related Models

In the `Therapist` model, add:
```prisma
specialties   TherapistSpecialty[]
```

In the `Practice` model, add:
```prisma
specialties   PracticeSpecialty[]
```

### Run Migration

```bash
cd backend
npx prisma migrate dev --name add_treatment_types
```

---

## 🔐 **Phase 2: Authentication & Registration**

### 2.1 Backend: Complete Auth Service

**File:** `backend/src/auth/auth.service.ts`

```typescript
// Add to auth.service.ts
async registerPatient(registerDto: RegisterDto) {
  const patient = await this.prisma.user.create({
    data: {
      email: registerDto.email,
      name: registerDto.name,
      telefon: registerDto.telefon,
      plz: registerDto.plz,
      role: 'PATIENT',
      password: await bcrypt.hash(registerDto.password, 10),
    },
  });

  return this.generateTokens(patient);
}

private generateTokens(user: User) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  
  const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

  return { accessToken, refreshToken, user };
}
```

### 2.2 Frontend: Patient Registration Form

**File:** `frontend/src/app/register/ClientRegister.tsx`

Key fields needed:
- Email
- Password (with strength indicator)
- Name
- Phone number
- Postal code (PLZ)
- Terms acceptance
- Email verification

---

## 🔍 **Phase 3: Search with Filters**

### 3.1 Backend: Enhanced Search Endpoint

**File:** `backend/src/search/search.service.ts`

```typescript
// Add advanced search with filters
async searchPractices(filters: {
  plz: string;
  radius?: number;      // km radius
  treatmentId?: string; // Treatment type filter
  fromDate?: Date;      // Earliest appointment
  toDate?: Date;        // Latest appointment
}) {
  // 1. Find practices by PLZ with radius
  // 2. Filter by treatment types offered
  // 3. Check availability in date range
  // 4. Return practices with available slots
}
```

### 3.2 Frontend: Search Page with Map

**File:** `frontend/src/app/search/ClientSearch.tsx`

Components needed:
1. **Search Bar**
   - PLZ input
   - Date picker
   - Radius slider (5-50km)

2. **Filters Sidebar**
   - Treatment type checkboxes
   - Price range filter
   - Rating filter

3. **Results Map**
   - Leaflet/Mapbox integration
   - Practice markers with info windows

4. **Results List**
   - Practice cards with:
     - Name & address
     - Rating & reviews
     - Available slots
     - Distance from patient
     - "View Details" button

---

## 📅 **Phase 4: Practice Detail Page & Calendar**

### 4.1 Frontend: Practice Detail Page

**File:** `frontend/src/app/practices/[id]/page.tsx`

Components:
1. **Practice Header**
   - Name, address, phone
   - Rating & review count
   - Map with location marker

2. **Therapist List**
   - Name, specialties
   - Average rating
   - Next available appointment

3. **Treatment Options**
   - Filter by treatment type
   - Show available therapists for each

4. **Calendar Widget**
   - Show next 30 days
   - Green = slots available
   - Click to book

### 4.2 Backend: Availability Endpoint

```typescript
// GET /api/practices/:practiceId/availability?fromDate=&toDate=&treatmentId=
async getAvailability(practiceId: string, filters: {
  fromDate: Date;
  toDate: Date;
  treatmentId?: string;
}) {
  // Return slots grouped by date and therapy
  // Format: { date: [{ time, therapist, treatmentType, available }] }
}
```

---

## 🎯 **Phase 5: Appointment Booking System**

### 5.1 Frontend: Booking Flow

**File:** `frontend/src/app/appointments/book/page.tsx`

Step-by-step form:
1. Select therapist (if multiple)
2. Confirm treatment type
3. Choose time slot
4. Add notes/comments
5. Review & confirm
6. Submit booking

### 5.2 Backend: Booking Controller

```typescript
// POST /api/appointments
async createAppointment(createDto: CreateAppointmentDto) {
  // 1. Validate slot is still available
  // 2. Create appointment record
  // 3. Update availability status
  // 4. Send confirmation email/SMS
  // 5. Return confirmation
}
```

---

## 📧 **Phase 6: Email & SMS Notifications**

### 6.1 Setup Email Service

Add to `backend/.env`:
```
MAIL_PROVIDER=sendgrid  # or nodemailer, mailgun
MAIL_API_KEY=...
MAIL_FROM=noreply@terminzauber.de
```

### 6.2 Email Templates

Create `backend/src/mail/templates/`:
- `appointment-confirmation.html`
- `appointment-reminder.html`
- `new-appointment-practice.html`
- `verification-email.html`

### 6.3 SMS Service (Optional)

Add Twilio integration:
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## 👥 **Phase 7: Patient Dashboard**

### 7.1 Frontend: Dashboard Page

**File:** `frontend/src/app/dashboard/page.tsx`

Components:
1. **Upcoming Appointments**
   - Date, time, practice
   - Therapist name
   - Cancel/reschedule buttons
   - Directions link

2. **Past Appointments**
   - Show rating/review option
   - Rebook quickly button

3. **Favorite Practices**
   - Saved/bookmarked practices
   - Quick links to search for them

4. **Account Settings**
   - Edit profile
   - Change password
   - Notification preferences

---

## ⭐ **Phase 8: Ratings & Reviews**

### 8.1 Backend: Rating Endpoint

```typescript
// POST /api/appointments/:appointmentId/rating
async createRating(appointmentId: string, ratingDto: {
  rating: number;     // 1-5
  comment?: string;
  visible?: boolean;  // Show publicly
}) {
  // Validate appointment is completed
  // Create rating record
  // Update practice average rating
}
```

### 8.2 Frontend: Review Modal

Show after appointment completion with:
- Star picker (1-5)
- Text comment field
- Submit button

---

## 📱 **Implementation Checklist**

### Backend Tasks
- [ ] Add TreatmentType models to Prisma schema
- [ ] Create migration
- [ ] Implement auth service with password hashing (bcrypt)
- [ ] Build search service with filters
- [ ] Create availability query endpoints
- [ ] Implement appointment booking logic
- [ ] Add email/SMS service
- [ ] Create rating system endpoints
- [ ] Add input validation (class-validator)
- [ ] Generate Swagger documentation

### Frontend Tasks
- [ ] Complete patient registration form
- [ ] Build search page with filters
- [ ] Add map integration (Leaflet or Mapbox)
- [ ] Create practice detail page
- [ ] Build calendar/availability widget
- [ ] Implement booking flow
- [ ] Create confirmation screen
- [ ] Build patient dashboard
- [ ] Add review modal
- [ ] Add email verification flow
- [ ] Implement error handling & loading states
- [ ] Add responsive design for mobile

### Infrastructure Tasks
- [ ] Configure email provider (SendGrid/Mailgun)
- [ ] Set up SMS provider (Twilio) - optional
- [ ] Add environment variables
- [ ] Configure Stripe webhooks

---

## 🚀 **Recommended Development Order**

1. **Database Schema** (Phase 1)
2. **Backend Auth** (Phase 2)
3. **Frontend Registration** (Phase 2)
4. **Backend Search** (Phase 3)
5. **Frontend Search with Map** (Phase 3)
6. **Practice Detail Page** (Phase 4)
7. **Calendar/Availability** (Phase 4)
8. **Booking System** (Phase 5)
9. **Email Notifications** (Phase 6)
10. **Patient Dashboard** (Phase 7)
11. **Ratings** (Phase 8)

---

## 🔗 **Useful Libraries**

### Frontend
- **Maps:** `leaflet`, `react-leaflet` or `mapbox-gl`
- **Date Picking:** `react-day-picker`, `react-calendar`
- **Forms:** `react-hook-form`, `zod` (validation)
- **UI Components:** Extend your Tailwind setup
- **Notifications:** `react-toastify`, `react-hot-toast`

### Backend
- **Email:** `nodemailer`, `SendGrid`
- **SMS:** `twilio`
- **Password:** `bcrypt`
- **Date/Time:** `date-fns`
- **Validation:** `class-validator`
- **Rate Limiting:** `@nestjs/throttler`

---

## 📌 **Key Integration Points**

1. **Search → Practice Details:** Pass practice ID in URL
2. **Practice Details → Booking:** Store selected details in state
3. **Booking → Confirmation:** Auto-redirect to confirmation page
4. **Confirmation → Dashboard:** Show appointment in next section
5. **Dashboard → Booking:** Quick "rebook" functionality

---

## ✨ **User Flow Summary**

```
Registration Page
    ↓
Login (if returning)
    ↓
Homepage/Search Page (PLZ + Date + Treatment Filter)
    ↓
Practice List with Map
    ↓
Practice Detail Page (Calendar + Therapists)
    ↓
Booking Confirmation (Review details)
    ↓
Confirmation Email/SMS
    ↓
Dashboard (View appointment)
    ↓
After Appointment: Rate & Review
```

---

## 🆘 **Questions?**

Key points to clarify with your team:
- Which email provider? (SendGrid is easiest)
- SMS notifications required? (Adds cost)
- Map provider preference? (Leaflet has no key requirements)
- Payment for patients? (Currently setup for practice subscriptions)
- Multi-language? (Currently German)
- Appointment length options? (Currently 30 min default)
