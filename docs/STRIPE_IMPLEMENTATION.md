# Stripe Payment Integration - Implementierungs-Zusammenfassung

**Status:** ✅ Vollständig implementiert

---

## 🎯 Überblick

PhysioMatch akzeptiert jetzt Stripe-Zahlungen für Praxis-Abonnements. **Nur Praxen (ADMIN-Benutzer) zahlen** für die Aktivierung ihrer Profile - Patienten buchen kostenlos.

### Preismodell
- **BASIS:** 5€/Monat  
- **PRO:** 15€/Monat

---

## 📦 Backend-Implementierung

### PaymentsService (`src/payments/payments.service.ts`)

#### Funktionen:
- `createCheckoutSession()` - Erstellt Stripe Checkout Session
- `handleWebhook()` - Verarbeitet Stripe Events
- `cancelSubscription()` - Kündigt Abo
- `getSubscriptionDetails()` - Ruft Abo-Status ab

#### Webhook-Verarbeitung:
- ✅ `checkout.session.completed` - Aktiviert Abo  
- ✅ `invoice.paid` - Erfasst Zahlung  
- ✅ `invoice.payment_failed` - Sperrt Praxis  
- ✅ `customer.subscription.deleted` - Kündigt Abo  
- ✅ `customer.subscription.updated` - Aktualisiert Perioden  

### PaymentsController (`src/payments/payments.controller.ts`)

#### Endpoints:

| Methode | Route | Beschreibung | Auth |
|---------|-------|-------------|------|
| POST | `/api/payments/create-checkout-session` | Checkout starten | ✅ ADMIN |
| GET | `/api/payments/subscription` | Abo abrufen | ✅ ADMIN |
| DELETE | `/api/payments/subscription` | Abo kündigen | ✅ ADMIN |
| POST | `/api/payments/webhook` | Stripe Webhooks | ❌ Public |

**Sicherheit:**
- ✅ Nur ADMIN-Benutzer dürfen bezahlen (RolesGuard)
- ✅ JWT-Token erforderlich
- ✅ Webhook-Signatur verifiziert

### main.ts (Raw Body Middleware)

Raw body wird für Webhook Signatur-Verifikation benötigt:
```typescript
app.use('/api/payments/webhook', json({ 
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  } 
}));
```

---

## 💳 Frontend-Implementierung

### Subscription Seite (`/practice/subscription`)
- 📱 Responsive Design
- 💳 2 Plan-Optionen (BASIS vs PRO)
- 📊 Aktuelle Subscription anzeigen
- 🔄 Upgrade/Downgrade möglich
- ❌ Kündigen-Button
- ❓ FAQ-Sektion

### Success Page (`/practice/subscription/success`)
- ✅ Bestätigung nach erfolgreicher Zahlung
- 📋 Nächste Schritte
- 🔗 Führt zum Dashboard

### Cancel Page (`/practice/subscription/cancel`)
- ℹ️ Benutzer hat Checkout abgebrochen
- 🔙 Zurück-Buttons

### Practice Dashboard (`/practice/dashboard`)
- 🏥 Praxis-Überblick
- 🎯 Quick-Action-Buttons:
  - Abonnement verwalten
  - Therapeuten hinzufügen
  - Verfügbarkeiten eintragen
  - Buchungen anzeigen
- 📖 Onboarding-Guide
- ℹ️ Wichtige Infos

---

## 🗄️ Datenbankmodelle

### Subscription (1:1 zu Practice)
```prisma
model Subscription {
  practiceId              String (unique)
  stripeCustomerId        String
  stripeSubscriptionId    String (unique)
  aboTyp                  AboTyp
  status                  AboStatus
  currentPeriodStart      DateTime
  currentPeriodEnd        DateTime
}
```

### Payment (N zu Practice)
```prisma
model Payment {
  practiceId      String
  stripePaymentId String (unique)
  betrag          Float
  zahlungsdatum   DateTime
  status          PaymentStatus
  aboTyp          AboTyp
  invoice_url     String
}
```

---

## 🔒 Sicherheit & Compliance

### Authentifizierung
- ✅ JWT Tokens (Bearer Scheme)
- ✅ RolesGuard - Nur ADMIN darf bezahlen
- ✅ PracticeId Validierung

### Zahlungssicherheit
- ✅ Stripe Hosted Checkout (keine Credit Cards im System)
- ✅ Webhook Signature Verification
- ✅ Raw Body Handling für HMAC-Verifizierung
- ✅ API Keys in Environment Variables

### Datenschutz
- ✅ Stripe ist EU-zertifiziert
- ✅ PCI DSS Level 1 (Stripe gehandhabt)
- ✅ DSGVO-konform
- ✅ Rechnungs-URLs werden gespeichert (Einsicht möglich)

---

## 🧪 Test-Kreditkarten

Nur im **Test Mode** verwenden:

| Nummer | CVC | Status |
|--------|-----|--------|
| `4242 4242 4242 4242` | Beliebig | ✅ Zahlung erfolgreich |
| `4000 0000 0000 0002` | Beliebig | ❌ Zahlung abgelehnt |
| `5555 5555 5555 4444` | Beliebig | ✅ MasterCard OK |

---

## 🚀 Deployment

### Environment Variables erforderlich:

```bash
# Backend + Frontend
STRIPE_SECRET_KEY=sk_test_...              # Geheim!
STRIPE_WEBHOOK_SECRET=whsec_...            # Geheim!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain/api
FRONTEND_URL=https://your-domain
```

### Webhook URL registrieren:

Im Stripe Dashboard:
```
https://your-domain/api/payments/webhook
```

Gewählte Events:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`

---

## 📊 User Flow

```
Praxis-Admin
    ↓
Registrierung (kostenlos)
    ↓
/practice/dashboard
    ↓
Klick: "Abonnement"
    ↓
/practice/subscription (2 Pläne)
    ↓
Plan wählen (BASIS: 5€ oder PRO: 15€)
    ↓
POST /api/payments/create-checkout-session
    ↓
Stripe Hosted Checkout
    ↓
Zahlungsdaten eingeben
    ↓
Zahlung erfolgreich
    ↓
Webhook: checkout.session.completed
    ↓
In DB: Subscription.create()
    ↓
Practice.aboStatus = ACTIVE
    ↓
/practice/subscription/success
    ↓
Praxis in Suche sichtbar ✅
    ↓
Patienten können buchen
```

---

## 🔗 Links & Dokumentation

- **Stripe Setup Guide:** `docs/STRIPE_SETUP.md`
- **Stripe Dashboard:** https://dashboard.stripe.com
- **API Docs:** `https://your-domain/api/docs` (Swagger)

---

## 📝 Checkliste für Setup

- [ ] Stripe Account erstellen (https://stripe.com)
- [ ] Test Mode API Keys kopieren
- [ ] Environment Variables in `.env` setzen
- [ ] Webhook URL: `https://your-domain/api/payments/webhook`
- [ ] Docker-Container neustarten
- [ ] Praxis registrieren & Dashboard aufrufen
- [ ] Test-Zahlung durchführen (Test-Kartennummer)
- [ ] Webhook im Stripe Dashboard überprüfen
- [ ] Subscription in DB prüfen
- [ ] Praxis sollte aboStatus = ACTIVE haben

---

## 🐛 Häufige Probleme

### "Nur Praxis-Admins können bezahlen"
→ Stelle sicher, dass Du als **ADMIN** angemeldet bist (role=ADMIN)

### Webhook wird nicht verarbeitet
→ Überprüfe: raw body middleware in `main.ts`

### Invalid API Key
→ Überprüfe: `.env` hat korrekten `STRIPE_SECRET_KEY`

### Checkout URL funktioniert nicht
→ Überprüfe: `FRONTEND_URL` und `NEXT_PUBLIC_API_URL` in `.env`

---

## 📈 Nächste Schritte (optional)

- [ ] Rechnungs-PDFs per Email versenden
- [ ] Recurring billing customization
- [ ] Promo Codes/Coupons
- [ ] Invoice archiving
- [ ] Team Members Billing Split
