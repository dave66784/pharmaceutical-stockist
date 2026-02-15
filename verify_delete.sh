#!/bin/bash

BASE_URL="http://localhost:8080/api"

# 1. Login
echo "Logging in..."
LOGIN_PAYLOAD='{
  "email": "test@example.com",
  "password": "password123"
}'
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" > login_response.json

TOKEN=$(cat login_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Check login_response.json"
  cat login_response.json
  exit 1
fi
echo "Login successful."

# 2. Create Product
echo "Creating product..."
CREATE_PAYLOAD='{
  "name": "Delete Test Product",
  "description": "To be deleted",
  "manufacturer": "Test Mfg",
  "price": 10.00,
  "stockQuantity": 100,
  "category": "OTHER",
  "isPrescriptionRequired": false
}'
curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD" > create_response.json

echo "Create Response: $(cat create_response.json)"
PRODUCT_ID=$(cat create_response.json | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PRODUCT_ID" ]; then
  echo "Failed to create product."
  exit 1
fi
echo "Created Product ID: $PRODUCT_ID"

# 3. Verify Product Exists in List
echo "Verifying product in list..."
curl -s -X GET "$BASE_URL/products" > products_list_before.json
if grep -q "\"id\":$PRODUCT_ID" products_list_before.json; then
  echo "Product found in list."
else
  echo "Product NOT found in list immediately after creation!"
  exit 1
fi

# 4. Delete Product
echo "Deleting product $PRODUCT_ID..."
curl -s -X DELETE "$BASE_URL/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN" > delete_response.json
echo "Delete Response: $(cat delete_response.json)"

# 5. Verify Product is GONE from List
echo "Verifying product is gone from list..."
curl -s -X GET "$BASE_URL/products" > products_list_after.json
if grep -q "\"id\":$PRODUCT_ID" products_list_after.json; then
  echo "FAILURE: Product $PRODUCT_ID still found in list after deletion!"
  exit 1
else
  echo "SUCCESS: Product $PRODUCT_ID is no longer in the list."
fi

# 6. Verify Product still fetchable by ID (optional, depending on requirement, but checking behavior)
echo "Checking fetch by ID behavior..."
curl -s -X GET "$BASE_URL/products/$PRODUCT_ID" > fetch_by_id.json
# Should return the product but with isDeleted=true if we exposed it, or just the product.
# We didn't filter getProductById in Service, so it should be there.
if grep -q "\"id\":$PRODUCT_ID" fetch_by_id.json; then
    echo "Product accessible by ID (Expected behavior for Admin/History)."
else
    echo "Product NOT accessible by ID."
fi

echo "Verification script finished."
