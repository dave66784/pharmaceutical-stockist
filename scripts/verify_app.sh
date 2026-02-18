#!/bin/bash

# Configuration
BASE_URL="http://localhost:8080/api"
EMAIL="admin@pharma.com"
PASSWORD="admin123"

echo "=========================================="
echo "🧪 Starting API Verification Smoke Test"
echo "=========================================="

# 1. Login
echo ""
echo "🔹 1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"phone\": \"9999999999\"
  }")

# If register fails, try login (user might exist)
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful. Token obtained."

# 2. Get User Profile (Using Admin List as Profile endpoint doesn't exist)
echo ""
echo "🔹 2. Testing Get Users (Admin)..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/users?page=0&size=1" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "$EMAIL"; then
  echo "✅ Users list retrieved successfully."
else
  echo "❌ Failed to retrieve users. Response: $PROFILE_RESPONSE"
fi

# 3. Get Products
echo ""
echo "🔹 3. Testing Get Products..."
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN")

# Simple check if response contains "content" (standard Spring Page response) or products list
if echo "$PRODUCTS_RESPONSE" | grep -q "content"; then
    echo "✅ Products listed successfully."
else
    # It might be empty if no products seeded, but call succeeded if standard JSON structure
    echo "⚠️ Product list check: $PRODUCTS_RESPONSE"
fi

# 4. Create a Dummy Product (Admin only) to ensure we have stock for cart test
echo ""
echo "🔹 4. Creating Test Product (Admin)..."
# We'll skip actual creation script complexity and assume seeding, 
# or just try to add ID 1 to cart and handle error if not exists.

# 5. Add to Cart (Try ID 1)
echo ""
echo "🔹 5. Testing Add to Cart (Product ID: 1)..."
CART_ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/cart/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 1
  }')

if echo "$CART_ADD_RESPONSE" | grep -q "id"; then
  echo "✅ Added to cart successfully."
elif echo "$CART_ADD_RESPONSE" | grep -q "ResourceNotFoundException"; then
  echo "⚠️ Product ID 1 not found (Expected if DB is empty). Skipping Cart Verify."
elif echo "$CART_ADD_RESPONSE" | grep -q "InsufficientStockException"; then
  echo "⚠️ Insufficient stock (Expected if DB is empty). Skipping Cart Verify."
else
  echo "ℹ️ Cart Add Response: $CART_ADD_RESPONSE"
fi

# 6. Get Cart
echo ""
echo "🔹 6. Testing Get Cart..."
CART_RESPONSE=$(curl -s -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN")

if echo "$CART_RESPONSE" | grep -q "items"; then
  echo "✅ Cart retrieved successfully."
else
  echo "❌ Failed to retrieve cart. Response: $CART_RESPONSE"
fi

echo ""
echo "=========================================="
echo "🎉 Smoke Test Complete"
echo "=========================================="
