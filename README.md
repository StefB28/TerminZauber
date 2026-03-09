# PhysioMatch 🌿

**Claim:** _"Freie Termine. Sofort gefunden."_

PhysioMatch ist eine moderne Multi-Tenant SaaS-Plattform, die Physiotherapiepraxen in Deutschland mit Patienten verbindet, die kurzfristig verfügbare Termine suchen.

## 🎯 Vision

**Reduzierung von Kalender-Lücken in Physiotherapiepraxen und einfache Terminbuchung für Patienten.**

- **Für Praxen:** Kalenderlücken reduzieren, Ausfälle automatisch nachbesetzen, neue Patienten erreichen
- **Für Patienten:** Kurzfristig verfügbare Termine in der Nähe finden, ohne lange Wartezeiten

## 🏗️ Tech-Stack

### Backend
- **NestJS** - Enterprise-grade Node.js Framework
- **PostgreSQL** - Relationale Datenbank
- **Prisma ORM** - Type-safe Database Access
- **JWT Authentication** - Sichere Authentifizierung
- **Stripe Integration** - Zahlungsabwicklung (5€ Basis / 15€ Pro)
- **Swagger/OpenAPI** - API-Dokumentation

### Frontend
- **Next.js 14** - React Framework mit App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Utility-first CSS (Primärfarbe: #22c55e)
- **Zustand** - State Management
- **Axios** - HTTP Client

### Infrastructure
- **Docker & Docker Compose** - Containerisierung
- **PostgreSQL** - EU-Server kompatibel
- **Hetzner** - Deployment-Ziel (DSGVO-konform)

## 💰 Preismodell

### Basis – 5€/Monat
- Kalender manuell verwalten
- Terminanzeige für Patienten
- Kurzfristige Lücken füllen
- Standard-Support

### Pro – 15€/Monat
Alles aus Basis PLUS:
- Automatische Kalendersynchronisation (Google, Outlook)
- Statistiken & Auslastungsanalyse
- Marketing-Tools & Hervorhebung
- Automatische Terminoptimierung
- Priorisierte Anzeige in Suchergebnissen

## 📊 Hauptfunktionen

### Für Patienten
- ✅ Registrierung/Login
- 🔍 Suche nach PLZ und Wunschdatum
- 📅 Nächstmögliche Termine anzeigen
- 📝 Terminbuchung mit E-Mail-Bestätigung
- ⭐ Praxis-Bewertungen
- 🔔 Warteliste & Push-Benachrichtigungen

### Für Praxen
- ✅ Registrierung/Login
- 📊 Kalenderübersicht
- ⏰ Freie Zeiten manuell/automatisch eintragen
- 🚨 Kurzfristige Absagen markieren
- 👥 Mitarbeiterverwaltung (Therapeuten)
- 📈 Statistiken & Auslastung (Pro)
- 💳 Stripe-Abonnement-Verwaltung
- 🎯 Marketing & Hervorhebung (Pro)

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (oder via Docker)
- Stripe Account

### Installation

1. **Repository klonen**
```bash
git clone <repository-url>
cd PhysioMatch
```

2. **Environment-Variablen einrichten**
```bash
cp .env.example .env
# .env bearbeiten und Secrets einfügen
```

3. **Mit Docker Compose starten**
```bash
docker-compose up -d
```

4. **Oder lokal entwickeln**
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (neues Terminal)
cd frontend
npm install
npm run dev
```

5. **Zugriff**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## 📁 Projektstruktur

```
PhysioMatch/
├── backend/              # NestJS Backend API
│   ├── src/
│   │   ├── auth/         # Authentication & JWT
│   │   ├── users/        # User Management
│   │   ├── practices/    # Practice Management
│   │   ├── therapists/   # Therapist Management
│   │   ├── appointments/ # Appointment Booking
│   │   ├── availability/ # Availability Management
│   │   ├── payments/     # Stripe Integration
│   │   ├── search/       # Search Engine
│   │   ├── prisma/       # Database Service
│   │   └── common/       # Guards, Decorators, DTOs
│   └── prisma/           # Database Schema
├── frontend/             # Next.js Frontend
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # React Components
│   │   ├── lib/          # API Client & Store
│   │   └── styles/       # Global Styles
└── docker-compose.yml    # Docker Setup
```

## 🔒 Sicherheit & DSGVO

- ✅ SSL/TLS-Verschlüsselung
- ✅ Passwort-Hashing mit bcrypt
- ✅ JWT-basierte Authentifizierung
- ✅ Rollenbasierte Zugriffskontrolle
- ✅ E-Mail-Verifizierung
- ✅ EU-Server-Hosting (Hetzner)
- ✅ DSGVO-konforme Datenverarbeitung
- ✅ SQL-Injection-Schutz (Prisma)
- ✅ CORS-Konfiguration

## 🎨 Design

**Farbschema:**
- Primär: Helles, leuchtendes Blattgrün (#22c55e)
- Hintergrund: Weiß
- Akzente: Dezente Grautöne

**Prinzipien:**
- Mobile-first Design
- Clean und intuitiv
- Große Buttons für einfache Bedienung
- Barrierefrei
- Schnelle Ladezeiten

## 📚 Weitere Dokumentation

- [SETUP.md](./docs/SETUP.md) - Detaillierte Setup-Anleitung
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Production Deployment (Hetzner)
- [DSGVO.md](./docs/DSGVO.md) - DSGVO-Compliance Checkliste
- [API.md](./docs/API.md) - API-Dokumentation

## 🧪 Testing

```bash
# Backend Tests
cd backend
npm run test

# Frontend Tests
cd frontend
npm run test
```

## 📦 Deployment

Siehe [DEPLOYMENT.md](./docs/DEPLOYMENT.md) für detaillierte Deployment-Anweisungen für:
- Hetzner Cloud
- Vercel (Frontend)
- Railway/Render (Backend)

## 🤝 Support

Bei Fragen oder Problemen:
- E-Mail: support@physiomatch.de
- Dokumentation: Siehe `docs/` Ordner

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

---

**PhysioMatch** - Made with 💚 in Germany
