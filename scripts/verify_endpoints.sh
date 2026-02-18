#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "Waiting for backend to be ready..."
sleep 5

# 1. Register
echo "1. Testing Registration..."
REGISTER_PAYLOAD='{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "phone": "1234567890"
}'
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_PAYLOAD" > register_response.json
echo "Registration Response: $(cat register_response.json)"
echo ""

# 2. Login and get Token
echo "2. Testing Login..."
LOGIN_PAYLOAD='{
  "email": "test@example.com",
  "password": "password123"
}'
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" > login_response.json
echo "Login Response: $(cat login_response.json)"
echo ""

# Extract Token (simple grep/sed as jq might not be available, assuming standard JSON format)
TOKEN=$(cat login_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to extract token. Login might have failed."
  exit 1
fi

echo "Token extracted successfully."
echo ""

# 3. Get Products (Public)
echo "3. Testing Get Products (Protected)..."
curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" > products_response.json
echo "Products Response Length: $(cat products_response.json | wc -c) bytes"
# echo "Products Response: $(cat products_response.json)" # Too verbose
echo ""

# 4. Get Cart (Protected)
echo "4. Testing Get Cart (Protected)..."
curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN" > cart_response.json
echo "Cart Response: $(cat cart_response.json)"
echo ""

# 5. Get Orders (Protected)
echo "5. Testing Get Orders (Protected)..."
curl -s -X GET "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN" > orders_response.json
echo "Orders Response: $(cat orders_response.json)"
echo ""

echo "Verification Complete."
