#!/bin/bash

# Test Registration Flows - Patient and Practice
# This script tests the registration endpoints for both user types

set -e

BASE_URL="https://localhost/api"
TIMESTAMP=$(date +%s)

echo "🧪 Testing Registration Flows..."
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check HTTP status
check_status() {
    local status=$1
    local expected=$2
    local msg=$3
    
    if [ "$status" -eq "$expected" ]; then
        echo -e "${GREEN}✓${NC} $msg - Status: $status"
        return 0
    else
        echo -e "${RED}✗${NC} $msg - Status: $status (expected $expected)"
        return 1
    fi
}

# Test 1: Patient Registration
echo "📝 Test 1: Patient Registration"
echo "--------------------------------"

PATIENT_EMAIL="patient_${TIMESTAMP}@test.com"
PATIENT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PATIENT_EMAIL"'",
    "name": "Test Patient",
    "password": "patient123",
    "role": "PATIENT",
    "telefon": "030123456",
    "plz": "10115"
  }')

PATIENT_STATUS=$(echo "$PATIENT_RESPONSE" | tail -n1)
PATIENT_BODY=$(echo "$PATIENT_RESPONSE" | sed '$d')

check_status "$PATIENT_STATUS" 201 "Patient registration"

# Extract token and validate response
PATIENT_TOKEN=$(echo "$PATIENT_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
PATIENT_ROLE=$(echo "$PATIENT_BODY" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PATIENT_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} JWT token received"
else
    echo -e "${RED}✗${NC} No JWT token in response"
fi

if [ "$PATIENT_ROLE" = "PATIENT" ]; then
    echo -e "${GREEN}✓${NC} Role correctly set to PATIENT"
else
    echo -e "${RED}✗${NC} Role is '$PATIENT_ROLE' (expected PATIENT)"
fi

echo ""

# Test 2: Practice (Admin) Registration
echo "🏥 Test 2: Practice Registration"
echo "---------------------------------"

PRACTICE_EMAIL="practice_${TIMESTAMP}@test.com"
PRACTICE_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PRACTICE_EMAIL"'",
    "name": "Test Praxis",
    "password": "practice123",
    "role": "ADMIN",
    "telefon": "030654321"
  }')

PRACTICE_STATUS=$(echo "$PRACTICE_RESPONSE" | tail -n1)
PRACTICE_BODY=$(echo "$PRACTICE_RESPONSE" | sed '$d')

check_status "$PRACTICE_STATUS" 201 "Practice registration"

# Extract token and validate response
PRACTICE_TOKEN=$(echo "$PRACTICE_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
PRACTICE_ROLE=$(echo "$PRACTICE_BODY" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PRACTICE_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} JWT token received"
else
    echo -e "${RED}✗${NC} No JWT token in response"
fi

if [ "$PRACTICE_ROLE" = "ADMIN" ]; then
    echo -e "${GREEN}✓${NC} Role correctly set to ADMIN"
else
    echo -e "${RED}✗${NC} Role is '$PRACTICE_ROLE' (expected ADMIN)"
fi

echo ""

# Test 3: Duplicate Email Prevention (Patient)
echo "🔒 Test 3: Duplicate Email Prevention"
echo "--------------------------------------"

DUPLICATE_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PATIENT_EMAIL"'",
    "name": "Duplicate Test",
    "password": "test12345"
  }')

DUPLICATE_STATUS=$(echo "$DUPLICATE_RESPONSE" | tail -n1)

check_status "$DUPLICATE_STATUS" 409 "Duplicate email rejection"

echo ""

# Test 4: Login with Patient Credentials
echo "🔑 Test 4: Patient Login"
echo "------------------------"

PATIENT_LOGIN_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PATIENT_EMAIL"'",
    "password": "patient123"
  }')

PATIENT_LOGIN_STATUS=$(echo "$PATIENT_LOGIN_RESPONSE" | tail -n1)
PATIENT_LOGIN_BODY=$(echo "$PATIENT_LOGIN_RESPONSE" | sed '$d')

check_status "$PATIENT_LOGIN_STATUS" 200 "Patient login"

PATIENT_LOGIN_TOKEN=$(echo "$PATIENT_LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PATIENT_LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} Login JWT token received"
else
    echo -e "${RED}✗${NC} No JWT token in login response"
fi

echo ""

# Test 5: Login with Practice Credentials
echo "🔑 Test 5: Practice Login"
echo "-------------------------"

PRACTICE_LOGIN_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PRACTICE_EMAIL"'",
    "password": "practice123"
  }')

PRACTICE_LOGIN_STATUS=$(echo "$PRACTICE_LOGIN_RESPONSE" | tail -n1)
PRACTICE_LOGIN_BODY=$(echo "$PRACTICE_LOGIN_RESPONSE" | sed '$d')

check_status "$PRACTICE_LOGIN_STATUS" 200 "Practice login"

PRACTICE_LOGIN_TOKEN=$(echo "$PRACTICE_LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$PRACTICE_LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} Login JWT token received"
else
    echo -e "${RED}✗${NC} No JWT token in login response"
fi

echo ""

# Test 6: Password Validation
echo "🔐 Test 6: Password Validation"
echo "-------------------------------"

SHORT_PW_EMAIL="shortpw_${TIMESTAMP}@test.com"
SHORT_PW_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$SHORT_PW_EMAIL"'",
    "name": "Short Password Test",
    "password": "short"
  }')

SHORT_PW_STATUS=$(echo "$SHORT_PW_RESPONSE" | tail -n1)

check_status "$SHORT_PW_STATUS" 400 "Short password rejection"

echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo -e "Patient registration email: ${YELLOW}${PATIENT_EMAIL}${NC}"
echo -e "Practice registration email: ${YELLOW}${PRACTICE_EMAIL}${NC}"
echo ""
echo -e "${GREEN}✓ All registration flows tested${NC}"
echo ""
echo "Registration endpoints are working correctly!"
