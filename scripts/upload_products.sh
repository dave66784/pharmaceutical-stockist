#!/bin/bash
# Script to upload products via Excel file to the running backend

# Get the absolute path to the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Configuration
API_URL="http://localhost:8080/api"
ADMIN_EMAIL="admin@pharma.com"
ADMIN_PASSWORD="admin123"
FILE_PATH="$PROJECT_ROOT/scripts/sample_products.xlsx"

echo "=========================================="
echo "📦 Uploading Products from Excel"
echo "=========================================="

# 1. Login as Admin to get the token
echo -e "\n🔹 Authenticating as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\", \"password\":\"$ADMIN_PASSWORD\"}")

# Extract token using grep/sed
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '\"token\":\"[^\"]*\"' | sed 's/\"token\":\"\([^"]*\)\"/\1/')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to obtain authentication token."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo "✅ Authentication successful."

# 2. Check if the file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Excel file not found at: $FILE_PATH"
    exit 1
fi

# 3. Upload the file
echo -e "\n🔹 Uploading $FILE_PATH..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/products/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE_PATH")

echo -e "\nServer Response:"
echo "$UPLOAD_RESPONSE" | grep -o '\"message\":\"[^\"]*\"' || echo "$UPLOAD_RESPONSE"

echo "=========================================="
echo "✅ Upload script completed."
echo "=========================================="
