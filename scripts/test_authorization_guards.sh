#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://localhost/api"
TS="$(date +%s)"
P1_EMAIL="auth_practice1_${TS}@test.com"
P2_EMAIL="auth_practice2_${TS}@test.com"

echo "== Authorization Guard Smoke Test =="

echo "[1/6] Register practice admin 1"
RESP1=$(curl -k -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$P1_EMAIL\",\"name\":\"Practice Admin 1\",\"password\":\"Practice123\",\"role\":\"ADMIN\"}")
TOKEN1=$(echo "$RESP1" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
USER1=$(echo "$RESP1" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN1" || -z "$USER1" ]]; then
  echo "❌ Could not create practice admin 1"
  exit 1
fi

echo "[2/6] Register practice admin 2"
RESP2=$(curl -k -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$P2_EMAIL\",\"name\":\"Practice Admin 2\",\"password\":\"Practice123\",\"role\":\"ADMIN\"}")
TOKEN2=$(echo "$RESP2" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
USER2=$(echo "$RESP2" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN2" || -z "$USER2" ]]; then
  echo "❌ Could not create practice admin 2"
  exit 1
fi

echo "[3/6] Create one practice for each admin via API"
P1_CREATE=$(curl -k -s -X POST "$BASE_URL/practices" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Auth Praxis 1\",\"adresse\":\"A Str 1\",\"plz\":\"10115\",\"stadt\":\"Berlin\",\"telefon\":\"0301\",\"email\":\"auth_p1_${TS}@test.com\"}")
P1_ID=$(echo "$P1_CREATE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

P2_CREATE=$(curl -k -s -X POST "$BASE_URL/practices" \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Auth Praxis 2\",\"adresse\":\"B Str 2\",\"plz\":\"20095\",\"stadt\":\"Hamburg\",\"telefon\":\"0402\",\"email\":\"auth_p2_${TS}@test.com\"}")
P2_ID=$(echo "$P2_CREATE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

if [[ -z "$P1_ID" || -z "$P2_ID" ]]; then
  echo "❌ Could not create test practices"
  echo "$P1_CREATE"
  echo "$P2_CREATE"
  exit 1
fi

echo "[4/6] Admin 1 creates therapist for own practice (should be 201/200)"
OK_CODE=$(curl -k -s -o /tmp/ok_resp.json -w "%{http_code}" -X POST "$BASE_URL/therapists" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Own Therapist"}')
if [[ "$OK_CODE" != "201" && "$OK_CODE" != "200" ]]; then
  echo "❌ Expected success, got HTTP $OK_CODE"
  cat /tmp/ok_resp.json
  exit 1
fi

THERAPIST_ID=$(sed -n 's/.*"id":"\([^"]*\)".*/\1/p' /tmp/ok_resp.json)

echo "[5/6] Admin 2 tries deleting therapist from practice 1 (should be 403)"
FORBIDDEN_CODE=$(curl -k -s -o /tmp/forbidden_resp.json -w "%{http_code}" -X DELETE "$BASE_URL/therapists/$THERAPIST_ID" \
  -H "Authorization: Bearer $TOKEN2")
if [[ "$FORBIDDEN_CODE" != "403" ]]; then
  echo "❌ Expected 403, got HTTP $FORBIDDEN_CODE"
  cat /tmp/forbidden_resp.json
  exit 1
fi

echo "[6/6] Admin 1 deletes own therapist (should be 200)"
DEL_CODE=$(curl -k -s -o /tmp/del_resp.json -w "%{http_code}" -X DELETE "$BASE_URL/therapists/$THERAPIST_ID" \
  -H "Authorization: Bearer $TOKEN1")
if [[ "$DEL_CODE" != "200" ]]; then
  echo "❌ Expected 200, got HTTP $DEL_CODE"
  cat /tmp/del_resp.json
  exit 1
fi

echo "✅ Authorization guard smoke test passed"
