#!/bin/bash

# Script to create admin user after docker restart
# Usage: ./create_admin.sh

BASE_URL="http://localhost:8080/api"
ADMIN_EMAIL="admin@pharma.com"
ADMIN_PASSWORD="Admin@123"

echo "=========================================="
echo "Admin User Creation Script"
echo "=========================================="
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Check if backend responds (even 403 is fine, means it's up)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health)
  if [ "$http_code" == "200" ] || [ "$http_code" == "403" ] || [ "$http_code" == "503" ]; then
    echo "✅ Backend is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Backend did not become ready in time. Please check docker-compose logs."
  exit 1
fi

echo ""
echo "📝 Initiating registration (sending OTP)..."

# Step 1: Send OTP
SEND_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"phone\": \"9999999999\"
  }")

echo "$SEND_OTP_RESPONSE" | grep -q "success.*true"
if [ $? -ne 0 ]; then
  # Check if user already exists
  if echo "$SEND_OTP_RESPONSE" | grep -q "already exists"; then
    echo "ℹ️  Admin user already exists, skipping registration"
  else
    echo "❌ Failed to initiate registration (send-otp)"
    echo "Response: $SEND_OTP_RESPONSE"
    exit 1
  fi
else
  echo "✅ OTP initiation successful"
  
  echo "📝 Verifying OTP and creating account..."
  # Step 2: Verify OTP (using test override 123456)
  VERIFY_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify-otp" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$ADMIN_EMAIL\",
      \"otp\": \"123456\"
    }")

  echo "$VERIFY_OTP_RESPONSE" | grep -q "success.*true"
  if [ $? -eq 0 ]; then
    echo "✅ Admin user registered successfully"
  else
    echo "❌ Failed to verify OTP"
    echo "Response: $VERIFY_OTP_RESPONSE"
    exit 1
  fi
fi

echo ""
echo "🔐 Updating user role to ADMIN..."


# Wait for user to be persisted
sleep 5

# Update the role to ADMIN directly in the database
docker exec -i pharma-db psql -U postgres -d pharma_db -c \
  "UPDATE users SET role = 'ADMIN' WHERE email = '$ADMIN_EMAIL';" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ User role updated to ADMIN"
else
  echo "❌ Failed to update user role"
  exit 1
fi

echo ""
echo "🎉 Admin user setup complete!"
echo ""
echo "=========================================="
echo "Admin Login Credentials:"
echo "Email:    $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo "=========================================="
echo ""
echo "You can now login at http://localhost:3000/login"
echo "and access the admin dashboard at http://localhost:3000/admin"
