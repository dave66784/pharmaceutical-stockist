#!/bin/bash
# Script to create an order and download the receipt to see the exact error

API_URL="http://localhost:8080/api"
EMAIL="admin@pharma.com"
PASSWORD="admin123"

echo "🔹 1. Registering test user if not exists..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\", \"firstName\":\"Test\", \"lastName\":\"User\", \"phone\":\"1234567890\"}" > /dev/null

echo "🔹 2. Authenticating as user..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '\"token\":\"[^\"]*\"' | sed 's/\"token\":\"\([^"]*\)\"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to obtain token."
    exit 1
fi

echo "🔹 3. Adding item to cart..."
curl -s -X POST "$API_URL/cart/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":1, \"quantity\":1}" > /dev/null

echo "🔹 4. Creating order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shippingAddress\":\"123 Test St\", \"paymentMethod\":\"COD\"}")

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '\"data\":{\"id\":[0-9]*' | sed 's/\"data\":{\"id\":\([0-9]*\)/\1/')

if [ -z "$ORDER_ID" ]; then
    echo "❌ Failed to create order."
    echo "$ORDER_RESPONSE"
    exit 1
fi

echo "✅ Order created with ID: $ORDER_ID"

echo "🔹 5. Downloading receipt..."
RECEIPT_RESPONSE=$(curl -s -v -X GET "$API_URL/orders/$ORDER_ID/receipt" \
  -H "Authorization: Bearer $TOKEN")

echo "Result:"
echo "$RECEIPT_RESPONSE"
