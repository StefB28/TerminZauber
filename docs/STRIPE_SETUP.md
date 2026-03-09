# Stripe Integration - Abonnement-Zahlungen (nur Praxen)

## 📋 Übersicht

PhysioMatch nutzt **Stripe** für sichere, PCI-konforme Zahlungsabwicklung. **Nur Praxen (ADMIN-Benutzer) zahlen** für Abonnements - Patienten können kostenlos buchen.

### Preismodell
- **BASIS**: 5€/Monat - Grundfunktionen
- **PRO**: 15€/Monat - Erweiterte Features

---

## 🔧 Konfiguration

### 1. Stripe Account erstellen

1. Gehe zu https://stripe.com/de
2. Klicke "Konto erstellen"
3. Bestätige deine E-Mail
4. Fülle die Praxisdaten aus
5. Erhielt Zugriff zu **Test Mode** und **Live Mode**

### 2. API Keys abrufen

**Test Mode** (für Entwicklung):
1. Dashboard → "Entwickler" → "API-Schlüssel"
2. Kopiere:
   - `Publishable Key` (öffentlich, Frontend)
   - `Secret Key` (geheim, Backend)

**Live Mode** (für Produktion):
1. Schalte Live Mode ein (oben rechts)
2. Wiederhole Schritt 1 für Live Keys

### 3. Webhook Endpoint einrichten

**Im Stripe Dashboard:**
1. Dashboard → "Entwickler" → "Webhooks"
2. Klicke "+ Endpoint hinzufügen"
3. URL: `https://your-domain.de/api/payments/webhook`
4. Events zum Abhören:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Kopiere `Signing Secret`

### 4. Environment Variables setzen

**`.env` Datei im Backend:**
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...         # Secret Key aus Test Mode
STRIPE_WEBHOOK_SECRET=whsec_...       # Signing Secret aus Webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Publishable Key
```

**docker-compose.yml (bereits konfiguriert):**
```yaml
backend:
  environment:
    STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
    
frontend:
  environment:
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
```

---

## 🔐 Sicherheit

### Backend (PaymentsService)
- ✅ Stripe SDK mit `apiVersion: '2024-12-18.acacia'`
- ✅ Webhook Signature Verifizierung (verhindert Spoofing)
- ✅ Raw Body Handling in main.ts
- ✅ Role-Based Access Control (nur ADMIN darf bezahlen)

### Frontend
- ✅ JWT Token erforderlich für Checkout
- ✅ HTTPS only (production)
- ✅ Redirect zu Stripe Hosted Checkout (nicht auf eigener Seite)

---

## 📱 User Flow

### Patient (kostenlos)
```
Registrierung → Suche → Buchung (kostenlos)
```

### Praxis (kostenpflichtig)
```
1. Registrierung (kostenlos)
2. Dashboard → "Abonnement"
3. Wählt "BASIS" oder "PRO"
4. → Stripe Checkout
5. Zahlung abgeschlossen
6. Webhook bestätigt Zahlung
7. aboStatus = ACTIVE ✅
8. Praxis in Suche sichtbar
```

---

## 🛣️ API Endpoints

### Nur für ADMIN (Praxen)

#### POST `/api/payments/create-checkout-session`
```bash
curl -X POST https://localhost/api/payments/create-checkout-session \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"aboTyp": "BASIS"}'

# Response
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

#### GET `/api/payments/subscription`
```bash
curl https://localhost/api/payments/subscription \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Response
{
  "id": "sub_...",
  "practiceId": "...",
  "aboTyp": "BASIS",
  "status": "ACTIVE",
  "currentPeriodEnd": "2026-04-09T12:00:00Z",
  "cancelAtPeriodEnd": false
}
```

#### DELETE `/api/payments/subscription`
```bash
curl -X DELETE https://localhost/api/payments/subscription \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Response
{
  "message": "Subscription erfolgreich gekündigt"
}
```

### Öffentlich (keine Auth)

#### POST `/api/payments/webhook`
Stripe sendet Events direkt hierin. Wird automatisch verarbeitet.

---

## 🧪 Test Kreditkarten (nur Test Mode!)

| Nummer | CVC | Datum | Szenario |
|--------|-----|-------|----------|
| `4242 4242 4242 4242` | Beliebig | Beliebig (zukünftig) | ✅ Zahlung erfolgreich |
| `4000 0000 0000 0002` | Beliebig | Beliebig | ❌ Zahlung abgelehnt |
| `5555 5555 5555 4444` | Beliebig | Beliebig | ✅ MasterCard erfolgreich |

---

## 🔄 Webhook Events

Wird automatisch verarbeitet - keine manuelle Konfiguration nötig:

### `checkout.session.completed`
→ Subscription in DB anlegen  
→ `aboStatus = ACTIVE` setzen  
→ Praxis wird sichtbar

### `invoice.paid`
→ Payment-Datensatz erstellen  
→ Status = COMPLETED

### `invoice.payment_failed`
→ `aboStatus = SUSPENDED`  
→ Praxis verschwindet aus Suche

### `customer.subscription.deleted`
→ `aboStatus = CANCELLED`  
→ Praxis nicht mehr sichtbar

### `customer.subscription.updated`
→ Perioden aktualisieren

---

## 📊 Datenbank

### Tabellen

**Subscription** (1:1 zu Practice)
```
- id (cuid)
- practiceId (unique)
- stripeCustomerId
- stripeSubscriptionId
- aboTyp (BASIS | PRO)
- status (ACTIVE | INACTIVE | SUSPENDED | CANCELLED)
- currentPeriodStart
- currentPeriodEnd
```

**Payment** (viele zu Practice)
```
- id (cuid)
- practiceId
- stripePaymentId (unique)
- betrag (€)
- zahlungsdatum
- status (PENDING | COMPLETED | FAILED | REFUNDED)
- aboTyp
- invoice_url
```

---

## 🚀 Frontend

### Abo-Seite
```
/practice/subscription
```

**Features:**
- ✅ Aktuelle Subscription anzeigen
- ✅ 2 Plan-Optionen (BASIS vs PRO)
- ✅ Upgrade/Downgrade möglich
- ✅ Kündigen-Button
- ✅ FAQ zur Zahlrichtlinie

### Nach Checkout
- ✅ `/practice/subscription/success` (Erfolg)
- ✅ `/practice/subscription/cancel` (Abgebrochen)

---

## 🐛 Debugging

### Problem: Webhook wird nicht verarbeitet
```
❌ "Raw body nicht verfügbar"
```
**Lösung:** Stelle sicher, dass main.ts `rawBody` middleware hat:
```typescript
app.use('/api/payments/webhook', json({ 
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  } 
}));
```

### Problem: 403 Forbidden bei Checkout
```
❌ "Nur Praxis-Admins können Abonnements abschließen"
```
**Lösung:** Prüfe, ob Benutzer mit `role: ADMIN` angemeldet ist.

### Problem: Stripe Keys sind ungültig
```
❌ "STRIPE_SECRET_KEY ist nicht konfiguriert"
```
**Lösung:** Setze die Keys in `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📈 Monitoring

### Im Stripe Dashboard
- **Payments**: Alle abgeschlossenen Zahlungen
- **Subscriptions**: Aktive / gekündigte Abos
- **Customers**: Praxen mit Stripe Account
- **Webhooks**: Fehler bei Event-Verarbeitung
- **Invoices**: Rechnungen pro Billing-Periode

---

## 🔐 Compliance

### PCI DSS
✅ Stripe handelt - **keine Kreditkartendaten** im eigenen System  
✅ Hosted Checkout vermeidet eigene PCI-Zertifizierung

### DSGVO
- ✅ Stripe EU-zertifiziert
- ✅ DPA (Data Processing Agreement) verfügbar
- ✅ Kundendaten verschlüsselt bei Transit & Rest

### Invoices
- ✅ invoice_url wird in Payment-DB gespeichert
- ✅ Patienten/Praxen können Rechnungen abrufen

---

## 📞 Support

Bei Problemen: **support@physiomatch.de**

Stripe Support: https://support.stripe.com
