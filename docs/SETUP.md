# PhysioMatch - Setup-Anleitung

Detaillierte Anleitung zur lokalen Einrichtung und Entwicklung.

## Voraussetzungen

### Software
- **Node.js** v18 oder höher ([Download](https://nodejs.org/))
- **npm** v9 oder höher (kommt mit Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Accounts
- **Stripe Test Account** ([Registrieren](https://stripe.com/))

## Lokale Entwicklung

### 1. Repository klonen

```bash
git clone <repository-url>
cd PhysioMatch
```

### 2. Environment-Variablen konfigurieren

```bash
# Hauptverzeichnis
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

**Backend `.env` bearbeiten:**
```env
DATABASE_URL="postgresql://physiomatch:physiomatch_password@localhost:5432/physiomatch?schema=public"
JWT_SECRET="dein-sicherer-secret-key"
STRIPE_SECRET_KEY="sk_test_..."  # Von Stripe Dashboard
STRIPE_WEBHOOK_SECRET="whsec_..." # Nach Webhook-Setup
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

**Frontend `.env` bearbeiten:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Von Stripe Dashboard
```

### 3. Datenbank starten (Docker)

```bash
docker-compose up -d db
```

### 4. Backend einrichten

```bash
cd backend

# Dependencies installieren
npm install

# Prisma Client generieren
npx prisma generate

# Datenbank-Migrationen ausführen
npx prisma migrate dev

# Optional: Prisma Studio öffnen (DB GUI)
npx prisma studio
```

### 5. Backend starten

```bash
# Development-Modus mit Hot-Reload
npm run start:dev
```

Backend läuft auf: http://localhost:4000
API Docs: http://localhost:4000/api/docs

### 6. Frontend einrichten

```bash
# Neues Terminal öffnen
cd frontend

# Dependencies installieren
npm install
```

### 7. Frontend starten

```bash
# Development-Modus mit Hot-Reload
npm run dev
```

Frontend läuft auf: http://localhost:3000

## Stripe Webhook einrichten (lokal)

Für lokales Testen der Stripe-Webhooks:

### 1. Stripe CLI installieren

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.18.0/stripe_1.18.0_linux_x86_64.tar.gz
tar -xvf stripe_1.18.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### 2. Stripe CLI anmelden

```bash
stripe login
```

### 3. Webhook forwarding starten

```bash
stripe listen --forward-to localhost:4000/payments/webhook
```

Kopiere das `whsec_...` Secret und füge es in `backend/.env` ein:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Docker Compose Setup (Alles zusammen)

### Komplettes System starten

```bash
# Build und Start
docker-compose up --build

# Im Hintergrund
docker-compose up -d
```

### Services
- **db:** PostgreSQL auf Port 5432
- **backend:** NestJS API auf Port 4000
- **frontend:** Next.js auf Port 3000

### Logs ansehen

```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### Services stoppen

```bash
docker-compose down

# Mit Volume-Löschung (Datenbank zurücksetzen)
docker-compose down -v
```

## Datenbank-Verwaltung

### Neue Migration erstellen

```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Schema ändern

1. `backend/prisma/schema.prisma` bearbeiten
2. Migration erstellen:
```bash
npx prisma migrate dev --name add_new_field
```

### Datenbank zurücksetzen

```bash
npx prisma migrate reset
```

### Prisma Studio öffnen

```bash
npx prisma studio
```

Öffnet GUI auf: http://localhost:5555

## Test-Daten erstellen

### Test-Patient erstellen

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.de",
    "name": "Max Mustermann",
    "password": "testpassword123",
    "role": "PATIENT",
    "plz": "10115"
  }'
```

### Test-Praxis erstellen

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "praxis@test.de",
    "name": "Physiopraxis Berlin",
    "password": "testpassword123",
    "role": "ADMIN"
  }'
```

## Häufige Probleme

### Port bereits belegt

```bash
# Port 4000 belegt?
lsof -i :4000
kill -9 <PID>

# Port 3000 belegt?
lsof -i :3000
kill -9 <PID>
```

### Prisma-Fehler nach Schema-Änderung

```bash
npx prisma generate
npx prisma migrate dev
```

### Docker-Container funktioniert nicht

```bash
docker-compose down -v
docker-compose up --build
```

### Datenbank-Verbindung fehlgeschlagen

1. Prüfe ob PostgreSQL läuft:
```bash
docker-compose ps
```

2. Prüfe `DATABASE_URL` in `.env`

3. Neustart:
```bash
docker-compose restart db
```

## Nächste Schritte

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production Deployment
- [DSGVO.md](./DSGVO.md) - DSGVO-Compliance
- API-Dokumentation: http://localhost:4000/api/docs
