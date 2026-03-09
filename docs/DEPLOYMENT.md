# PhysioMatch - Deployment auf Hetzner

Deployment-Anleitung für Production auf Hetzner Cloud (DSGVO-konform).

## 🎯 Deployment-Architektur

- **Server:** Hetzner Cloud (Deutschland/Falkenstein)
- **Backend:** NestJS mit PM2
- **Frontend:** Next.js Static Export oder Vercel
- **Datenbank:** PostgreSQL (Managed Database oder Self-Hosted)
- **Domain:** eigene Domain mit SSL
- **Reverse Proxy:** Nginx

## 1. Hetzner Cloud Server erstellen

### Server-Spezifikationen

**Empfehlung für Start:**
- **CPX21** (3 vCPU, 4 GB RAM, 80 GB SSD) - ~7€/Monat
- **Location:** Falkenstein (Deutschland) - DSGVO-konform
- **Image:** Ubuntu 22.04

### Server erstellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Projekt erstellen: "PhysioMatch Production"
3. Server hinzufügen:
   - Location: **Falkenstein** (DE)
   - Image: **Ubuntu 22.04**
   - Type: **CPX21**
   - SSH-Key hinzufügen
4. Server erstellen

### Erste Schritte auf dem Server

```bash
# SSH-Verbindung
ssh root@<server-ip>

# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install -y docker-compose

# Nginx installieren
apt install -y nginx

# Certbot für SSL
apt install -y certbot python3-certbot-nginx

# Git installieren
apt install -y git
```

## 2. PostgreSQL Datenbank

### Option A: Hetzner Managed PostgreSQL (Empfohlen)

1. In Hetzner Console: "Add Managed Database"
2. PostgreSQL Version 15
3. Plan: DB1 (1 vCPU, 2 GB RAM) - ~13€/Monat
4. Location: Falkenstein
5. Datenbank-Credentials notieren

### Option B: Self-Hosted PostgreSQL

```bash
# PostgreSQL installieren
apt install -y postgresql postgresql-contrib

# PostgreSQL Benutzer erstellen
sudo -u postgres psql
CREATE DATABASE physiomatch;
CREATE USER physiomatch WITH ENCRYPTED PASSWORD 'sicheres_passwort';
GRANT ALL PRIVILEGES ON DATABASE physiomatch TO physiomatch;
\q

# PostgreSQL für externe Verbindungen konfigurieren
nano /etc/postgresql/14/main/postgresql.conf
# Zeile ändern: listen_addresses = 'localhost'

nano /etc/postgresql/14/main/pg_hba.conf
# Hinzufügen: host all all 0.0.0.0/0 md5

systemctl restart postgresql
```

## 3. Projekt auf Server deployen

### Repository klonen

```bash
cd /var/www
git clone <repository-url> PhysioMatch
cd PhysioMatch
```

### Environment-Variablen einrichten

```bash
# Haupt-Environment
nano .env
```

```env
DATABASE_URL="postgresql://physiomatch:PASSWORT@localhost:5432/physiomatch?schema=public"
JWT_SECRET="SICHERER-PRODUCTION-SECRET-MIN-32-ZEICHEN"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="https://physiomatch.de"
PORT=4000
NEXT_PUBLIC_API_URL="https://api.physiomatch.de"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### Backend deployen

```bash
cd backend

# Dependencies installieren
npm ci --only=production

# Prisma Setup
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# PM2 installieren (Process Manager)
npm install -g pm2

# Backend mit PM2 starten
pm2 start dist/main.js --name physiomatch-backend

# PM2 Auto-Start einrichten
pm2 startup
pm2 save
```

### Frontend deployen

#### Option A: Vercel (Empfohlen für Frontend)

1. Repository mit Vercel verbinden
2. Environment-Variablen in Vercel setzen
3. Deployment starten
4. Custom Domain konfigurieren

#### Option B: Self-Hosted mit Nginx

```bash
cd frontend

# Dependencies und Build
npm ci --only=production
npm run build

# PM2 starten
pm2 start npm --name physiomatch-frontend -- start
pm2 save
```

## 4. Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/physiomatch
```

```nginx
# API Server
server {
    listen 80;
    server_name api.physiomatch.de;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (nur wenn self-hosted)
server {
    listen 80;
    server_name physiomatch.de www.physiomatch.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Nginx Config aktivieren
ln -s /etc/nginx/sites-available/physiomatch /etc/nginx/sites-enabled/

# Nginx testen und neustarten
nginx -t
systemctl restart nginx
```

## 5. SSL-Zertifikat (Let's Encrypt)

```bash
# Certbot für SSL
certbot --nginx -d api.physiomatch.de
certbot --nginx -d physiomatch.de -d www.physiomatch.de

# Auto-Renewal testen
certbot renew --dry-run
```

## 6. Stripe Webhook Production

1. Gehe zu [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. "Add endpoint" klicken
3. URL: `https://api.physiomatch.de/payments/webhook`
4. Events auswählen:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Webhook Secret kopieren und in `.env` einfügen

## 7. Monitoring & Logs

### PM2 Logs

```bash
# Logs anzeigen
pm2 logs

# Nur Backend
pm2 logs physiomatch-backend

# Monitoring Dashboard
pm2 monit

# Status
pm2 status
```

### Nginx Logs

```bash
# Access Logs
tail -f /var/log/nginx/access.log

# Error Logs
tail -f /var/log/nginx/error.log
```

## 8. Backup-Strategie

### Datenbank-Backup

```bash
# Backup-Script erstellen
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

pg_dump -U physiomatch -h localhost physiomatch > $BACKUP_DIR/physiomatch_$DATE.sql
gzip $BACKUP_DIR/physiomatch_$DATE.sql

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Ausführbar machen
chmod +x /root/backup-db.sh

# Cronjob einrichten (täglich um 2 Uhr)
crontab -e
0 2 * * * /root/backup-db.sh
```

## 9. Updates deployen

```bash
cd /var/www/PhysioMatch

# Code aktualisieren
git pull origin main

# Backend Update
cd backend
npm ci --only=production
npm run build
npx prisma migrate deploy
pm2 restart physiomatch-backend

# Frontend Update
cd ../frontend
npm ci --only=production
npm run build
pm2 restart physiomatch-frontend
```

## 10. Sicherheit

### Firewall einrichten

```bash
# UFW installieren und konfigurieren
apt install -y ufw

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### Fail2Ban (Brute-Force-Schutz)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## Kosten-Übersicht (monatlich)

- Hetzner Server CPX21: ~7€
- Hetzner Managed PostgreSQL DB1: ~13€ (oder 0€ self-hosted)
- Domain: ~10€/Jahr
- **Total: ~20€/Monat + Domain**

## Troubleshooting

### Backend startet nicht

```bash
pm2 logs physiomatch-backend
pm2 restart physiomatch-backend
```

### Datenbank-Verbindung fehlgeschlagen

```bash
# PostgreSQL Status
systemctl status postgresql

# Connection testen
psql -U physiomatch -h localhost -d physiomatch
```

### SSL-Probleme

```bash
certbot renew --force-renewal
systemctl restart nginx
```

## Skalierung

Bei wachsenden Nutzerzahlen:

1. **Load Balancer** hinzufügen
2. **Redis** für Session-Management
3. **Größeren Server** wählen (CPX31, CPX41)
4. **Managed PostgreSQL** auf größeren Plan upgraden
5. **CDN** für statische Assets (Cloudflare)

---

**Deployment erfolgreich!** 🚀
PhysioMatch läuft jetzt production-ready auf Hetzner.
