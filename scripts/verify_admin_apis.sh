#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "============================================"
echo "Admin API Verification Test"
echo "============================================"
echo ""

echo "Waiting for backend to be ready..."
sleep 10

# 1. Login as admin
echo "1. Testing Admin Login..."
ADMIN_LOGIN_PAYLOAD='{
  "email": "admin@pharma.com",
  "password": "admin123"
}'
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_LOGIN_PAYLOAD" > admin_login_response.json
echo "Admin Login Response: $(cat admin_login_response.json)"
echo ""

# Extract Admin Token
ADMIN_TOKEN=$(cat admin_login_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to extract admin token. Login might have failed."
  exit 1
fi

echo "✅ Admin token extracted successfully."
echo ""

# 2. Test Dashboard Stats API
echo "2. Testing Dashboard Statistics API..."
curl -s -X GET "$BASE_URL/admin/dashboard/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" > dashboard_stats_response.json
echo "Dashboard Stats Response:"
cat dashboard_stats_response.json | python3 -m json.tool 2>/dev/null || cat dashboard_stats_response.json
echo ""
echo ""

# 3. Test Get All Users API
echo "3. Testing Get All Users API..."
curl -s -X GET "$BASE_URL/admin/users?page=0&size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" > users_response.json
echo "Users Response:"
cat users_response.json | python3 -m json.tool 2>/dev/null || cat users_response.json
echo ""
echo ""

# 4. Test Get Users by Role
echo "4. Testing Get Users by Role (CUSTOMER)..."
curl -s -X GET "$BASE_URL/admin/users/role/CUSTOMER?page=0&size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" > customers_response.json
echo "Customers Response:"
cat customers_response.json | python3 -m json.tool 2>/dev/null || cat customers_response.json
echo ""
echo ""

# 5. Test Get All Orders (Admin)
echo "5. Testing Get All Orders (Admin)..."
curl -s -X GET "$BASE_URL/admin/orders?page=0&size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" > admin_orders_response.json
echo "Admin Orders Response:"
cat admin_orders_response.json | python3 -m json.tool 2>/dev/null || cat admin_orders_response.json
echo ""
echo ""

# 6. Create a test customer and update their role
echo "6. Testing User Role Update..."
echo "First, registering a test user..."
REGISTER_PAYLOAD='{
  "email": "testuser@example.com",
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

# Extract the user ID from the registration response
USER_ID=$(cat register_response.json | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$USER_ID" ]; then
  echo "Updating user role to ADMIN for user ID: $USER_ID..."
  curl -s -X PUT "$BASE_URL/admin/users/$USER_ID/role?role=ADMIN" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" > role_update_response.json
  echo "Role Update Response:"
  cat role_update_response.json | python3 -m json.tool 2>/dev/null || cat role_update_response.json
  echo ""
else
  echo "⚠️  Could not extract user ID, skipping role update test"
fi

echo ""
echo "============================================"
echo "✅ API Verification Complete!"
echo "============================================"

# Cleanup
rm -f admin_login_response.json dashboard_stats_response.json users_response.json customers_response.json admin_orders_response.json register_response.json role_update_response.json
