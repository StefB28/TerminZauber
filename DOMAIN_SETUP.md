# PhysioMatch Domain & HTTPS Setup Guide

This guide will help you set up PhysioMatch with a clean domain name and HTTPS using Nginx and Let's Encrypt.

## Prerequisites

- A domain name pointing to your server's IP address
- Docker and Docker Compose installed
- A server with ports 80 and 443 open

## Step 1: Add Your Domain to Environment File

Copy the example environment file and configure it with your actual domain:

```bash
cp .env.example .env
```

Edit `.env` and update these values:

```env
DOMAIN=your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
JWT_SECRET=generate-a-secure-random-string-here
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Important**: Generate a secure JWT secret. You can use:
```bash
openssl rand -base64 32
```

## Step 2: Configure Your Domain DNS

Point your domain to your server's IP address using DNS A record:

```
your-domain.com  A  your.server.ip.address
```

Wait for DNS propagation to complete (usually takes a few minutes to a few hours).

## Step 3: Create SSL Certificate Directories

```bash
mkdir -p ssl certbot
```

## Step 4: Initial Certificate Generation

Before running Docker Compose, you need to generate your Let's Encrypt certificate:

### Option A: Using Certbot Standalone (Recommended)

First, make sure ports 80 and 443 are free:

```bash
# Stop any existing Docker containers using these ports
docker-compose down

# Generate certificate using standalone mode
docker run -it --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/certbot:/var/www/certbot \
  -p 80:80 \
  -p 443:443 \
  certbot/certbot certonly \
  --standalone \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com

# The certificate will be stored in ssl/live/your-domain.com/
```

### Option B: Using Manual DNS Validation

If you can't use standalone mode:

```bash
docker run -it --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  certbot/certbot certonly \
  --manual \
  --preferred-challenges dns \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com
```

Follow the on-screen instructions to add DNS TXT records.

## Step 5: Create Symlink for Default Certificate Path

```bash
# Navigate to your SSL directory
cd ssl/live

# Create a symlink from your domain to 'default' for easier Nginx configuration
ln -s your-domain.com default

cd ../../
```

## Step 6: Start the Application

Now you can start all services:

```bash
docker-compose up -d
```

Monitor the logs:

```bash
docker-compose logs -f
```

Your site should now be accessible at: **https://your-domain.com**

## Step 7: Set Up Certificate Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

### Option A: Using Certbot in Docker (Recommended)

Create a script `renew-cert.sh`:

```bash
#!/bin/bash
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot renew \
  --non-interactive \
  --agree-tos
```

Make it executable:
```bash
chmod +x renew-cert.sh
```

Add to your crontab to run daily (edit with `crontab -e`):
```
0 3 * * * cd /var/www/physiomatch/PhysioMatch && ./renew-cert.sh
```

### Option B: Manual Renewal

You can manually renew at any time:

```bash
docker-compose down

docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot renew

docker-compose up -d
```

## Step 8: Testing Your Setup

1. **Access your site:**
   - Frontend: https://your-domain.com
   - API: https://your-domain.com/api/...

2. **Check SSL certificate:**
   ```bash
   openssl s_client -connect your-domain.com:443
   ```

3. **Verify certificate in browser:**
   - Open https://your-domain.com in your browser
   - Click the lock icon to view certificate details

4. **Test API endpoints:**
   ```bash
   curl -X GET https://your-domain.com/api/health
   ```

## Troubleshooting

### 1. Certificate Not Found Error

If Nginx complains about missing certificate:
```
ssl_certificate /etc/letsencrypt/live/default/fullchain.pem: No such file or directory
```

Run Step 5 again to create the symlink.

### 2. Connection Refused

If you can't connect to your domain:
- Check firewall rules allow ports 80 and 443
- Verify DNS points to correct IP: `nslookup your-domain.com`
- Check Nginx logs: `docker-compose logs nginx`

### 3. Certificate Renewal Issues

Check renewal logs:
```bash
docker logs physiomatch-nginx
```

### 4. Mixed Content Warning

If frontend loads but shows HTTPS warnings:
- Ensure `NEXT_PUBLIC_API_URL` uses `https://your-domain.com/api`
- Clear browser cache completely

## Architecture

```
User Request
    ↓
Nginx (Port 80/443)
    ├→ /api/* → Backend (Port 4000)
    ├→ /_next/* → Frontend (Port 3000)
    └→ /* → Frontend (Port 3000)
```

## Security Notes

- All environment variables with secrets should never be committed to git
- The `.env` file is in `.gitignore`
- Nginx enforces HTTPS with automatic HTTP→HTTPS redirect
- SSL/TLS 1.2+ only, strong ciphers enabled
- Security headers configured (HSTS, X-Frame-Options, etc.)

## Updating Application

When you need to redeploy:

```bash
# Pull latest changes
git pull

# Rebuild containers
docker-compose build

# Restart services
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

Certificate and port configuration will remain intact.

## Port Reference

- **80**: HTTP (auto-redirects to HTTPS)
- **443**: HTTPS (all traffic)
- **5432**: PostgreSQL (internal only, not exposed)
- **4000**: Backend (internal only, proxied through Nginx)
- **3000**: Frontend (internal only, proxied through Nginx)

Only ports 80 and 443 are exposed to the public!

## Support

For Let's Encrypt issues: https://certbot.eff.org/docs/
For Nginx help: http://nginx.org/en/docs/
