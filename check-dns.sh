#!/bin/bash

echo "Checking DNS for terminzauber.de..."
nslookup terminzauber.de | grep "Address:" | tail -1

echo ""
echo "Testing connection..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://terminzauber.de/

echo ""
echo "If DNS shows 157.180.22.197 and connection works, we can generate SSL certificate."
echo "Run this command when ready:"
echo ""
echo "systemctl stop apache2 && \\"
echo "docker run --rm -v \$(pwd)/ssl:/etc/letsencrypt -v \$(pwd)/certbot:/var/www/certbot -p 80:80 -p 443:443 certbot/certbot certonly --standalone --agree-tos -m stseb9@gmail.com -d terminzauber.de && \\"
echo "cd ssl/live && ln -s terminzauber.de default && cd ../.. && \\"
echo "systemctl start apache2 && \\"
echo "docker-compose up -d"