#!/usr/bin/env bash
set -euo pipefail

BASE_SEARCH="https://localhost"
BASE_API="https://localhost/api"

ADMIN_EMAIL="admin.seed.$(date +%s)@example.com"
ADMIN_PASS="SeedAdmin123!"

PATIENT_EMAIL="smoke.patient.$(date +%s)@example.com"
PATIENT_PASS="SmokeTest123!"

json_get() {
  local file="$1"
  local expr="$2"
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const expr=process.argv[2];const val=eval(expr);process.stdout.write(val==null?'':String(val));" "$file" "$expr"
}

echo "== Seed demo data =="

curl -k -s -o /tmp/admin_reg.json -w "admin_register_status=%{http_code}\n" -X POST "$BASE_API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"name\":\"Seed Admin\",\"password\":\"$ADMIN_PASS\",\"role\":\"ADMIN\"}"

curl -k -s -o /tmp/admin_login.json -w "admin_login_status=%{http_code}\n" -X POST "$BASE_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"

ADMIN_TOKEN=$(json_get /tmp/admin_login.json "j.access_token")
if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "admin token missing"
  cat /tmp/admin_login.json
  exit 1
fi

PRACTICE_EMAIL="praxis.mitte.test.$(date +%s)@example.com"
curl -k -s -o /tmp/seed_practice.json -w "create_practice_status=%{http_code}\n" -X POST "$BASE_API/practices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Praxis Mitte Test\",\"adresse\":\"Teststrasse 1\",\"plz\":\"10115\",\"stadt\":\"Berlin\",\"telefon\":\"030123456\",\"email\":\"$PRACTICE_EMAIL\",\"beschreibung\":\"Seeded demo practice\"}"

PRACTICE_ID=$(json_get /tmp/seed_practice.json "j.id")
if [[ -z "$PRACTICE_ID" ]]; then
  echo "practice id missing"
  cat /tmp/seed_practice.json
  exit 1
fi
echo "seed_practice_id=$PRACTICE_ID"

curl -k -s -o /tmp/seed_practice_patch.json -w "activate_practice_status=%{http_code}\n" -X PATCH "$BASE_API/practices/$PRACTICE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"aboStatus":"ACTIVE"}'

curl -k -s -o /tmp/seed_therapist.json -w "create_therapist_status=%{http_code}\n" -X POST "$BASE_API/therapists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"practiceId\":\"$PRACTICE_ID\",\"name\":\"Therapeut Demo\"}"

THERAPIST_ID=$(json_get /tmp/seed_therapist.json "j.id")
if [[ -z "$THERAPIST_ID" ]]; then
  echo "therapist id missing"
  cat /tmp/seed_therapist.json
  exit 1
fi
echo "seed_therapist_id=$THERAPIST_ID"

TOMORROW=$(date -d '+1 day' +%F)
curl -k -s -o /tmp/seed_availability.json -w "create_availability_status=%{http_code}\n" -X POST "$BASE_API/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"therapistId\":\"$THERAPIST_ID\",\"datum\":\"$TOMORROW\",\"startzeit\":\"09:00\",\"endzeit\":\"09:30\",\"status\":\"FREI\"}"

echo "seed_done_for_date=$TOMORROW"

echo "== Smoke patient flow =="

curl -k -s -o /tmp/patient_reg.json -w "patient_register_status=%{http_code}\n" -X POST "$BASE_API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PATIENT_EMAIL\",\"name\":\"Smoke Patient\",\"password\":\"$PATIENT_PASS\",\"role\":\"PATIENT\",\"plz\":\"10115\"}"

curl -k -s -o /tmp/patient_login.json -w "patient_login_status=%{http_code}\n" -X POST "$BASE_API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$PATIENT_EMAIL\",\"password\":\"$PATIENT_PASS\"}"

PATIENT_TOKEN=$(json_get /tmp/patient_login.json "j.access_token")
if [[ -z "$PATIENT_TOKEN" ]]; then
  echo "patient token missing"
  cat /tmp/patient_login.json
  exit 1
fi
echo "patient_token_received=yes"

curl -k -s -o /tmp/search.json -w "search_status=%{http_code}\n" "$BASE_SEARCH/search/available-slots?plz=10115"
SEARCH_COUNT=$(json_get /tmp/search.json "Array.isArray(j)?j.length:0")
echo "search_results=$SEARCH_COUNT"
if [[ "$SEARCH_COUNT" -eq 0 ]]; then
  echo "search returned no practices"
  exit 2
fi

TARGET_PRACTICE_ID=$(json_get /tmp/search.json "j[0]?.id")
echo "target_practice_id=$TARGET_PRACTICE_ID"

curl -k -s -o /tmp/practice.json -w "practice_status=%{http_code}\n" "$BASE_API/practices/$TARGET_PRACTICE_ID"
TARGET_THERAPIST_ID=$(json_get /tmp/practice.json "j?.therapists?.[0]?.id")
if [[ -z "$TARGET_THERAPIST_ID" ]]; then
  echo "no therapist in target practice"
  exit 3
fi
echo "target_therapist_id=$TARGET_THERAPIST_ID"

curl -k -s -o /tmp/availability.json -w "availability_status=%{http_code}\n" "$BASE_API/availability/therapist/$TARGET_THERAPIST_ID?fromDate=$TOMORROW" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

SLOT=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('/tmp/availability.json','utf8'));const s=(Array.isArray(j)?j:[]).find(x=>x.status==='FREI'||x.status==='KURZFRISTIG_FREI'); if(!s){process.exit(2)}; const d=String(s.datum||'').split('T')[0]; const t=String(s.startzeit||'').substring(11,16); process.stdout.write(d+'|'+t);") || true
if [[ -z "$SLOT" ]]; then
  echo "no free slot available"
  exit 4
fi
DATUM=${SLOT%|*}
UHRZEIT=${SLOT#*|}
echo "selected_slot=$DATUM $UHRZEIT"

curl -k -s -o /tmp/book.json -w "book_status=%{http_code}\n" -X POST "$BASE_API/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d "{\"practiceId\":\"$TARGET_PRACTICE_ID\",\"therapistId\":\"$TARGET_THERAPIST_ID\",\"datum\":\"$DATUM\",\"uhrzeit\":\"$UHRZEIT\",\"dauer\":30}"

APPOINTMENT_ID=$(json_get /tmp/book.json "j.id")
if [[ -z "$APPOINTMENT_ID" ]]; then
  echo "booking failed body:"
  cat /tmp/book.json
  exit 5
fi
echo "appointment_id=$APPOINTMENT_ID"

curl -k -s -o /tmp/myappointments.json -w "my_appointments_status=%{http_code}\n" "$BASE_API/appointments" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

FOUND=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('/tmp/myappointments.json','utf8'));const id=process.argv[1];const ok=(Array.isArray(j)?j:[]).some(a=>a.id===id);process.stdout.write(ok?'yes':'no');" "$APPOINTMENT_ID")
echo "appointment_present_in_my_list=$FOUND"

echo "SMOKE_TEST_DONE"
