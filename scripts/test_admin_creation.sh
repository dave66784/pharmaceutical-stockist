#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "Creating admin user via registration..."

# Register admin user
ADMIN_REGISTER='{
  "email": "admin@pharma.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "9999999999"
}'

curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_REGISTER"

echo ""
echo "Admin user created. Now testing login..."

# Login
LOGIN_PAYLOAD='{
  "email": "admin@pharma.com",
  "password": "admin123"
}'

curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD"

echo ""
