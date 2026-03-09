# 💰 Zahlungsmodell - Nur Praxen zahlen!

## 🎯 Kernprinzip

**Nur Praxen zahlen für Abonnements - Patienten buchen kostenlos!**

```
PATIENTEN                  PRAXEN
  ↓                          ↓
Kostenlos                  Abonnement erforderlich
  ↓                          ↓
Registrierung ✅            Registrierung ✅
Suche ✅                     Abo auswählen (5€ oder 15€)
Termine buchen ✅           Nur dann in Suche sichtbar ✅
```

---

## 💳 Abonnement-Pläne (für Praxen)

| Feature | BASIS | PRO |
|---------|-------|-----|
| **Preis** | 5€/Monat | 15€/Monat |
| **Unbegrenzte Anfragen** | ✅ | ✅ |
| **Patientenverwaltung** | ✅ | ✅ |
| **Verfügbarkeitskalender** | ✅ | ✅ |
| **Grundstatistiken** | ✅ | ✅ |
| **Erweiterte Statistiken** | ❌ | ✅ |
| **Terminserien** | ❌ | ✅ |
| **API-Zugang** | ❌ | ✅ |
| **Priority Support** | ❌ | ✅ |

---

## 👤 Patient-Perspektive

### ✅ Patienten zahlen NICHT!

```
1. Account erstellen (kostenlos)
2. Praxis suchen (kostenlos)
3. Therapeuten auswählen (kostenlos)
4. Termin buchen (kostenlos)
5. Termin wahrnehmen
```

**Kosten:** 0€

Die Praxis entscheidet, wann der Patient zahlt (z.B. in der Praxis beim Termin).

---

## 🏥 Praxis-Perspektive

### 💳 Praxen zahlen monatlich

```
1. Account erstellen (kostenlos)
2. Abonnement wählen
   → BASIS (5€/Monat)
   → PRO (15€/Monat)
3. Zahlung mit Kreditkarte/SEPA
4. Abo aktiv → Praxis in Suche sichtbar
5. Patienten können buchen
```

**Kosten:** 5€ oder 15€/Monat

---

## 🔄 Zahlungsfluss

### Auslöser für Zahlung

**Nur Praxis-Admins** können Zahlungen initiieren:

```typescript
// Nur ADMIN darf das tun:
POST /api/payments/create-checkout-session
Authorization: Bearer {JWT_TOKEN}
Body: { "aboTyp": "BASIS" }
```

**Rolle-Prüfung:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')  // ← Nur Admins dürfen bezahlen!
```

### Patient darf NICHT bezahlen

Wenn ein Patient versucht zu zahlen:
```json
{
  "statusCode": 403,
  "message": "Nur Praxis-Admins können Abonnements abschließen",
  "error": "Forbidden"
}
```

---

## 📊 In der Datenbank

### Subscription (gehört zur Praxis)

```prisma
model Subscription {
  practiceId              String      // ← Welche Praxis zahlt?
  aboTyp                  AboTyp      // BASIS oder PRO
  status                  AboStatus   // ACTIVE, CANCELLED, etc.
  stripeCustomerId        String      // Stripe's Kundenkonto (gehört Praxis)
  stripeSubscriptionId    String      // Stripe's Abo-ID
}

model Practice {
  aboStatus   AboStatus   // ACTIVE nur wenn Zahlung erhalten
  aboTyp      AboTyp      // BASIS oder PRO
  // ...
}
```

### Patientenkonten haben KEINE Zahlungsinformation

```prisma
model User {
  role        UserRole    // PATIENT, ADMIN, THERAPIST
  // ← KEINE Zahlungsinfo!
  // Patienten zahlen nicht
}
```

---

## 🔐 Sicherheit

### Nur Praxis-Admins dürfen:
- ✅ Abonnement erstellen
- ✅ Zahlungen durchführen
- ✅ Abonnement kündigen
- ✅ Abonnement-Details abrufen

### Patienten dürfen NICHT:
- ❌ Zahlungen durchführen
- ❌ Abonnements verwalten
- ❌ Andere Praxen bezahlen

**Implementierung:**
```typescript
// In PaymentsController
if (role !== 'ADMIN') {
  throw new ForbiddenException('Nur Praxis-Admins können bezahlen');
}
```

---

## 💬 Kommunikation

### Für Patienten
"PhysioMatch ist kostenlos für Sie! Buchen Sie einfach einen Termin bei Ihrer Wunschpraxis."

### Für Praxen
"Aktivieren Sie Ihre Praxis mit einem Abonnement (ab 5€/Monat) und empfangen Sie Buchungen von Patienten."

---

## ❓ FAQ

### Kann ein Patient sehen, dass die Praxis zahlte?
Nein. Der Patient bucht einfach und sieht nur die verfügbaren Termine.

### Was passiert, wenn eine Praxis nicht mehr zahlt?
```
Zahlung fehlgeschlagen
    ↓
Webhook: invoice.payment_failed
    ↓
Practice.aboStatus = SUSPENDED
    ↓
Praxis verschwindet aus Suche
    ↓
Patienten können nicht mehr buchen
```

### Kann man die Zahlung nachverfolgen?
Ja, für Praxis-Admins im Dashboard:
- Aktuelle Subscription Status
- Nächstes Zahlungsdatum
- Zahlungs-Historie
- Rechnungs-PDFs

### Gibt es Stornierungen?
Ja:
- Praxis kann Abo sofort kündigen
- Keine Restgebühren
- Zugang stoppt am Ende der Periode

---

## 📱 Frontend-Ansichten

### Patienten sehen:
- ✅ Login-Seite
- ✅ Such-Seite
- ✅ Praxis-Details
- ✅ Buchungs-Seite
- ✅ Meine Termine
- ❌ Zahlungs-Optionen (nicht vorhanden!)

### Praxis-Admins sehen:
- ✅ Login-Seite
- ✅ **Abonnement-Verwaltung** (`/practice/subscription`)
- ✅ **Dashboard** (`/practice/dashboard`)
- ✅ Therapeuten-Verwaltung
- ✅ Verfügbarkeiten-Verwaltung
- ✅ Buchungs-Verwaltung

---

## 🎯 Zusammenfassung

| | Patient | Praxis-Admin |
|---|---------|-------------|
| **Zahlen?** | ❌ Nein | ✅ Ja (5€ oder 15€/Monat) |
| **Registrierung kostenlos?** | ✅ Ja | ✅ Ja |
| **Buchen Termine?** | ✅ Ja | ❌ Nein |
| **Verwaltet Abonnement?** | ❌ Nein | ✅ Ja |
| **Sieht Praxis-Kalender?** | ✅ Ja | ✅ Ja |
| **Kann Zahlungen machen?** | ❌ Nein | ✅ Ja |

---

## 🚀 Deployment

Stelle sicher, dass in der Produktion die Stripe Keys korrekt gesetzt sind:

```bash
# Test Mode
STRIPE_SECRET_KEY=sk_test_...

# Oder Live Mode (real money!)
STRIPE_SECRET_KEY=sk_live_...
```

**Wichtig:** Live Mode Keys sind für echte Zahlungen. Nur mit Test-Keys entwickeln!
