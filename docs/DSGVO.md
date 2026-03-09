# PhysioMatch - DSGVO-Compliance Checkliste

Umfassende Checkliste zur Einhaltung der Datenschutz-Grundverordnung (DSGVO).

## ✅ Technische Maßnahmen

### Datenverschlüsselung

- [x] **SSL/TLS-Verschlüsselung** für alle Verbindungen (Let's Encrypt)
- [x] **Passwort-Hashing** mit bcrypt (Salt + Hash)
- [x] **JWT-Tokens** für sichere API-Authentifizierung
- [x] **Verschlüsselte Datenbank-Verbindungen** (PostgreSQL SSL)

### Datenspeicherung

- [x] **EU-Server-Hosting** (Hetzner Deutschland/Falkenstein)
- [x] **Datenminimierung** - nur notwendige Daten werden gespeichert
- [x] **Automatische Löschung** alter/inaktiver Accounts (nach 24 Monaten Inaktivität)
- [x] **Trennung sensibler Daten** (Multi-Tenancy mit Practice-ID)

### Zugriffskontrolle

- [x] **Rollenbasierte Zugriffskontrolle** (PATIENT, THERAPIST, ADMIN)
- [x] **JWT Guards** für geschützte Routen
- [x] **E-Mail-Verifizierung** bei Registrierung
- [x] **Passwort-Richtlinien** (min. 8 Zeichen)

### Sicherheit

- [x] **SQL-Injection-Schutz** (Prisma ORM)
- [x] **XSS-Protection** (React automatisch)
- [x] **CORS-Konfiguration** (nur erlaubte Origins)
- [x] **Rate Limiting** (optional mit express-rate-limit)
- [x] **Security Headers** (Helmet.js)

## 📋 Rechtliche Dokumente (zu erstellen)

### Erforderliche Seiten

- [ ] **Datenschutzerklärung** (Privacy Policy)
  - Welche Daten werden gesammelt
  - Wie werden Daten verwendet
  - Wie lange werden Daten gespeichert
  - Rechte der Nutzer
  - Kontakt des Datenschutzbeauftragten

- [ ] **Impressum**
  - Betreiberinformationen
  - Kontaktdaten
  - Handelsregister
  - Verantwortlicher nach § 55 Abs. 2 RStV

- [ ] **AGB (Allgemeine Geschäftsbedingungen)**
  - Nutzungsbedingungen
  - Haftungsausschluss
  - Zahlungsbedingungen
  - Kündigungsbedingungen

- [ ] **Cookie-Richtlinie**
  - Welche Cookies werden verwendet
  - Cookie-Banner mit Opt-in
  - Cookie-Einstellungen

## 🔐 Nutzerrechte implementieren

### Auskunftsrecht (Art. 15 DSGVO)

```typescript
// API-Endpoint: GET /users/me/data-export
async exportUserData(userId: string) {
  // Alle Nutzerdaten sammeln und als JSON/PDF exportieren
  const userData = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      appointments: true,
      ratings: true,
      practice: true,
    },
  });
  return userData;
}
```

### Recht auf Berichtigung (Art. 16 DSGVO)

```typescript
// API-Endpoint: PATCH /users/me
async updateUserData(userId: string, data: UpdateUserDto) {
  return this.prisma.user.update({
    where: { id: userId },
    data,
  });
}
```

### Recht auf Löschung (Art. 17 DSGVO)

```typescript
// API-Endpoint: DELETE /users/me
async deleteUserAccount(userId: string) {
  // Soft Delete oder Hard Delete je nach Anforderung
  await this.prisma.user.delete({
    where: { id: userId },
  });
  // Automatische Kaskaden-Löschung durch Prisma Schema
}
```

### Recht auf Datenübertragbarkeit (Art. 20 DSGVO)

```typescript
// API-Endpoint: GET /users/me/export
async exportUserDataPortable(userId: string) {
  const data = await this.getUserData(userId);
  // Als JSON oder CSV exportieren
  return {
    format: 'json',
    data,
  };
}
```

## 🛡️ Einwilligungen

### Cookie-Consent

```typescript
// Frontend: Cookie-Banner implementieren
// Optionen:
// - Notwendige Cookies (immer aktiv)
// - Funktionale Cookies (opt-in)
// - Marketing Cookies (opt-in)
```

### Datenverarbeitungs-Einwilligung

Bei Registrierung:
- [ ] Checkbox: "Ich stimme der Datenschutzerklärung zu" (Pflicht)
- [ ] Checkbox: "Ich möchte Newsletter erhalten" (Optional)
- [ ] Checkbox: "Ich stimme der Verwendung zu Marketing-Zwecken zu" (Optional)

## 📊 Datenverarbeitungs-Verzeichnis

Gemäß Art. 30 DSGVO:

### Verarbeitete Daten

| Datenart | Zweck | Rechtsgrundlage | Speicherdauer |
|----------|-------|-----------------|---------------|
| Name, E-Mail | Benutzerkonto | Vertragserfüllung (Art. 6 Abs. 1 lit. b) | Bis zur Löschung |
| Passwort (gehasht) | Authentifizierung | Vertragserfüllung | Bis zur Löschung |
| PLZ, Telefon | Terminvermittlung | Vertragserfüllung | Bis zur Löschung |
| Terminbuchungen | Service-Erbringung | Vertragserfüllung | 24 Monate nach Termin |
| Zahlungsdaten (Stripe) | Abrechnung | Vertragserfüllung | Siehe Stripe-Policy |
| IP-Adresse (Logs) | Sicherheit | Berechtigtes Interesse (Art. 6 Abs. 1 lit. f) | 7 Tage |

## 🔄 Auftragsverarbeiter (Art. 28 DSGVO)

Verträge zur Auftragsverarbeitung (AVV) abschließen mit:

### Cloud-Provider

- [x] **Hetzner Cloud** (Server-Hosting)
  - AVV: https://www.hetzner.com/legal/avv
  - Standort: Deutschland (DSGVO-konform)

- [ ] **Vercel** (Frontend-Hosting, optional)
  - AVV: https://vercel.com/legal/dpa
  - EU-Region verwenden

### Externe Services

- [x] **Stripe** (Zahlungsabwicklung)
  - AVV: https://stripe.com/de/privacy
  - PCI-DSS Level 1 zertifiziert

- [ ] **SendGrid/Mailgun** (E-Mail-Versand)
  - AVV erforderlich
  - EU-Server verwenden

## 📧 Datenschutz-Kontakt

### Datenschutzbeauftragter

Falls erforderlich (ab 20 Mitarbeiter oder Kerntätigkeit ist Datenverarbeitung):

```
Datenschutzbeauftragter
PhysioMatch GmbH
E-Mail: datenschutz@physiomatch.de
Telefon: +49 (0) XXX XXXXXXX
```

### Datenschutz-Anfragen

Alle Nutzer können Anfragen stellen:
- E-Mail: datenschutz@physiomatch.de
- Antwortzeit: maximal 30 Tage

## 🚨 Datenpannen-Meldung (Art. 33 DSGVO)

### Prozess bei Datenschutzverletzung

1. **Erkennung** der Verletzung
2. **Dokumentation** (Was, Wann, Wie viele Betroffene)
3. **Meldung an Aufsichtsbehörde** (innerhalb 72h)
4. **Benachrichtigung betroffener Nutzer** (bei hohem Risiko)

### Incident-Response-Plan

```bash
# Logs sichern
pm2 logs physiomatch-backend > incident-$(date +%Y%m%d).log

# Datenbank-Snapshot
pg_dump physiomatch > incident-db-$(date +%Y%m%d).sql

# Aufsichtsbehörde kontaktieren
# BfDI (Bundesbeauftragter für Datenschutz und Informationsfreiheit)
# https://www.bfdi.bund.de/
```

## ✅ DSGVO-Checkliste vor Go-Live

- [ ] SSL/TLS-Zertifikat installiert
- [ ] Datenschutzerklärung erstellt und verlinkt
- [ ] Impressum erstellt
- [ ] AGB erstellt
- [ ] Cookie-Banner implementiert
- [ ] E-Mail-Verifizierung aktiv
- [ ] Passwort-Hashing aktiv (bcrypt)
- [ ] Rollenbasierte Zugriffskontrolle funktioniert
- [ ] Daten-Export-Funktion implementiert
- [ ] Account-Löschung funktioniert
- [ ] AVV mit Hetzner abgeschlossen
- [ ] AVV mit Stripe abgeschlossen
- [ ] Backup-Strategie implementiert
- [ ] Logging-Richtlinien definiert (max. 7 Tage IP-Logs)
- [ ] Datenschutzbeauftragter bestellt (falls nötig)
- [ ] Incident-Response-Plan dokumentiert

## 📚 Weiterführende Links

- [DSGVO-Volltext](https://dsgvo-gesetz.de/)
- [BfDI (Aufsichtsbehörde)](https://www.bfdi.bund.de/)
- [Hetzner DSGVO](https://www.hetzner.com/legal/legal-notice)
- [Stripe Datenschutz](https://stripe.com/de/privacy)

---

**Hinweis:** Diese Checkliste ist eine Orientierung. Für vollständige DSGVO-Compliance sollte ein Datenschutzbeauftragter oder Rechtsanwalt konsultiert werden.
