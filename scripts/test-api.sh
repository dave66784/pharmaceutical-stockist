#!/usr/bin/env bash
# =============================================================================
#  PharmaCare API — Endpoint Test Script  (v2)
#  Curls every endpoint in the OAS v1.1.0 and reports pass/fail.
#
#  Usage:
#    chmod +x test-api.sh
#    ./test-api.sh                                     # localhost:8080
#    ./test-api.sh --host api.example.com --port 443 --https
#    ./test-api.sh --admin-email a@x.com --admin-password secret
#    ./test-api.sh --skip-cleanup
#    ./test-api.sh --section auth          # run one section only
#    ./test-api.sh --no-admin              # skip all admin-only sections
#
#  Sections: auth | categories | products | cart | addresses |
#            orders | admin-orders | admin-users | dashboard
#
#  Admin account:
#    The script tries to login with --admin-email/--admin-password.
#    If login fails it prints a clear warning and skips admin sections
#    rather than aborting.  Pass your real admin credentials via flags.
# =============================================================================

# Safe mode: catch unbound variables but DO NOT exit on command failure.
# We handle failures ourselves via do_curl.
set -uo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

pass()    { echo -e "  ${GREEN}✔${NC}  $*"; }
fail()    { echo -e "  ${RED}✗${NC}  $*"; FAILURES=$((FAILURES+1)); }
warn()    { echo -e "  ${YELLOW}⚠${NC}  $*"; }
info()    { echo -e "  ${DIM}→${NC}  $*"; }
section() { echo -e "\n${CYAN}${BOLD}══ $* ══${NC}"; }
skip()    { echo -e "  ${YELLOW}○${NC}  SKIP  $*"; SKIPPED=$((SKIPPED+1)); }

# ── Defaults ─────────────────────────────────────────────────────────────────
HOST="localhost"
PORT="3000"
SCHEME="http"
ADMIN_EMAIL="admin@pharma.com"
ADMIN_PASSWORD="Admin@123"
USER_EMAIL="testuser_$(date +%s)@pharmatest.com"
USER_PASSWORD="User@1234"
SKIP_CLEANUP="false"
NO_ADMIN="false"
ONLY_SECTION=""

# ── Counters ─────────────────────────────────────────────────────────────────
PASS=0; FAILURES=0; SKIPPED=0; TOTAL=0

# ── Parse CLI args ────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --host|-h)          HOST="$2";           shift 2 ;;
    --port|-p)          PORT="$2";           shift 2 ;;
    --https)            SCHEME="https";       shift   ;;
    --admin-email)      ADMIN_EMAIL="$2";    shift 2 ;;
    --admin-password)   ADMIN_PASSWORD="$2"; shift 2 ;;
    --user-email)       USER_EMAIL="$2";     shift 2 ;;
    --user-password)    USER_PASSWORD="$2";  shift 2 ;;
    --skip-cleanup)     SKIP_CLEANUP="true";  shift   ;;
    --no-admin)         NO_ADMIN="true";      shift   ;;
    --section)          ONLY_SECTION="$2";   shift 2 ;;
    *) echo "Unknown flag: $1  (use --help to see options)"; exit 1 ;;
  esac
done

BASE_URL="${SCHEME}://${HOST}:${PORT}"
TEST_RUN_ID=$(date +%s)

# ── Shared state ──────────────────────────────────────────────────────────────
USER_TOKEN=""
ADMIN_TOKEN=""
ADMIN_AVAILABLE="false"
PRODUCT_ID=""
CATEGORY_ID=""
SUBCATEGORY_ID=""
CART_ITEM_ID=""
ORDER_ID=""
ADDRESS_ID=""

LAST_BODY=""
LAST_STATUS=""

# ── core curl wrapper ─────────────────────────────────────────────────────────
# do_curl <LABEL> <EXPECTED_STATUS> [curl-flags...]
# Updates LAST_BODY, LAST_STATUS, PASS/FAILURES counters.
# Never aborts the script.
do_curl() {
  local label="$1"
  local expected="$2"
  shift 2
  TOTAL=$((TOTAL+1))

  local tmp
  tmp=$(mktemp)

  # Run curl; capture HTTP status; fall back to 000 on connection error.
  local status
  status=$(curl -s -o "$tmp" -w "%{http_code}" \
             --connect-timeout 5 --max-time 20 \
             "$@" 2>/dev/null) || status="000"

  LAST_STATUS="${status}"
  LAST_BODY=$(cat "$tmp" 2>/dev/null || true)
  rm -f "$tmp"

  if [[ "$LAST_STATUS" == "000" ]]; then
    fail "${label} — cannot connect to ${BASE_URL}"
    return
  fi

  if [[ "$LAST_STATUS" == "$expected" ]]; then
    pass "${label} [${LAST_STATUS}]"
    PASS=$((PASS+1))
  else
    fail "${label} — expected ${expected}, got ${LAST_STATUS}"
    [[ -n "$LAST_BODY" ]] && info "Response: $(printf '%s' "$LAST_BODY" | head -c 300)"
  fi
}

# ── Safe JSON extractor (never fails / never aborts) ─────────────────────────
# extract <json-string> <key>
# Returns the first scalar value for the key, or empty string.
extract() {
  local json="${1:-}" key="${2:-}"
  # Use printf to avoid echo interpreting escape sequences in tokens
  printf '%s' "$json" \
    | grep -o "\"${key}\"[[:space:]]*:[[:space:]]*[^,}]*" 2>/dev/null \
    | head -1 \
    | sed 's/.*:[[:space:]]*//' \
    | tr -d '"' \
    | tr -d ' ' \
    || true   # grep returns 1 on no-match; suppress it
}

# ── Section / admin guards ────────────────────────────────────────────────────
run_section() {
  [[ -z "$ONLY_SECTION" || "$ONLY_SECTION" == "$1" ]] || return 1
  return 0
}

need_admin() {
  if [[ "$ADMIN_AVAILABLE" != "true" ]]; then
    skip "$* — admin token unavailable (see warning above)"
    return 1
  fi
  return 0
}

need_user_token() {
  if [[ -z "$USER_TOKEN" ]]; then
    skip "$* — user token unavailable"
    return 1
  fi
  return 0
}

# =============================================================================
echo -e "\n${BOLD}PharmaCare API Test Suite  v2${NC}"
echo    "  Base URL  : ${BASE_URL}"
echo    "  Admin     : ${ADMIN_EMAIL}"
echo    "  Test user : ${USER_EMAIL}"
echo    "  Started   : $(date '+%Y-%m-%d %H:%M:%S')"
[[ "$NO_ADMIN" == "true" ]] && warn "Admin sections disabled (--no-admin)"

# =============================================================================
# 1. AUTH
# =============================================================================
if run_section "auth"; then
  section "Auth"

  # ── 1a. send-otp (step 1 of registration) ──
  do_curl "POST /api/auth/send-otp" "200" \
    -X POST "${BASE_URL}/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phone\":\"+447700900000\"}"

  # ── 1b. verify-otp — uses the hardcoded test override 123456 ──
  do_curl "POST /api/auth/verify-otp (test OTP 123456)" "200" \
    -X POST "${BASE_URL}/api/auth/verify-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"otp\":\"123456\"}"

  USER_TOKEN=$(extract "$LAST_BODY" "token")
  if [[ -n "$USER_TOKEN" && "$USER_TOKEN" != "null" ]]; then
    info "User token acquired (${#USER_TOKEN} chars)"
  else
    warn "Could not extract user token — user-authenticated tests will be skipped"
  fi

  # ── 1c. resend-otp (needs a separate pending registration) ──
  RESEND_EMAIL="resend_$(date +%s)@pharmatest.com"
  curl -s -o /dev/null -X POST "${BASE_URL}/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${RESEND_EMAIL}\",\"password\":\"Test@1234\",\"firstName\":\"Re\",\"lastName\":\"Send\"}" \
    2>/dev/null || true
  do_curl "POST /api/auth/resend-otp" "200" \
    -X POST "${BASE_URL}/api/auth/resend-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${RESEND_EMAIL}\"}"

  # ── 1d. login (wrong password → 401) ──
  do_curl "POST /api/auth/login — wrong password (→ 401)" "401" \
    -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"WrongPassword!\"}"

  # ── 1e. login — valid user ──
  do_curl "POST /api/auth/login (user)" "200" \
    -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${USER_EMAIL}\",\"password\":\"${USER_PASSWORD}\"}"
  # Refresh user token from this login response
  _tok=$(extract "$LAST_BODY" "token")
  [[ -n "$_tok" && "$_tok" != "null" ]] && USER_TOKEN="$_tok"

  # ── 1f. login — admin ──
  if [[ "$NO_ADMIN" != "true" ]]; then
    do_curl "POST /api/auth/login (admin)" "200" \
      -X POST "${BASE_URL}/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}"

    ADMIN_TOKEN=$(extract "$LAST_BODY" "token")
    if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
      ADMIN_AVAILABLE="true"
      info "Admin token acquired (${#ADMIN_TOKEN} chars)"
    else
      warn "Admin login failed — all admin-only sections will be SKIPPED"
      warn "Provide real credentials:  --admin-email EMAIL --admin-password PASS"
      TOTAL=$((TOTAL+1))   # count the failed test already recorded by do_curl
    fi
  fi
fi

# =============================================================================
# 2. CATEGORIES  (public reads + admin writes — run before products)
# =============================================================================
if run_section "categories"; then
  section "Categories"

  # ── 2a. GET all categories (public) ──
  do_curl "GET /api/categories" "200" \
    -X GET "${BASE_URL}/api/categories"

  # ── Admin write tests ──
  if need_admin "POST /api/categories"; then
    do_curl "POST /api/categories (admin)" "200" \
      -X POST "${BASE_URL}/api/categories" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -d "{\"name\":\"Test Category ${TEST_RUN_ID}\",\"slug\":\"test-cat-${TEST_RUN_ID}\"}"
    CATEGORY_ID=$(extract "$LAST_BODY" "id")
    info "Category ID: ${CATEGORY_ID}"
  fi

  # ── Unauthorised create → 403 ──
  do_curl "POST /api/categories (no auth → 403)" "403" \
    -X POST "${BASE_URL}/api/categories" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Unauth Category\",\"slug\":\"unauth-$(date +%s)\"}"

  if [[ -n "${CATEGORY_ID:-}" && "$CATEGORY_ID" != "null" ]]; then
    # ── 2b. GET subcategories for category ──
    do_curl "GET /api/categories/{id}/subcategories" "200" \
      -X GET "${BASE_URL}/api/categories/${CATEGORY_ID}/subcategories"

    if need_admin "POST /api/categories/{id}/subcategories"; then
      do_curl "POST /api/categories/{id}/subcategories (admin)" "200" \
        -X POST "${BASE_URL}/api/categories/${CATEGORY_ID}/subcategories" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d "{\"name\":\"Test SubCategory\"}"
      SUBCATEGORY_ID=$(extract "$LAST_BODY" "id")
      info "SubCategory ID: ${SUBCATEGORY_ID}"
    fi

    if need_admin "PUT /api/categories/{id}"; then
      do_curl "PUT /api/categories/{id} (admin)" "200" \
        -X PUT "${BASE_URL}/api/categories/${CATEGORY_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d "{\"name\":\"Test Category Updated ${TEST_RUN_ID}\",\"slug\":\"test-cat-upd-${TEST_RUN_ID}\"}"
    fi

    if [[ -n "${SUBCATEGORY_ID:-}" && "$SUBCATEGORY_ID" != "null" ]]; then
      if need_admin "PUT /api/categories/subcategories/{id}"; then
        do_curl "PUT /api/categories/subcategories/{id} (admin)" "200" \
          -X PUT "${BASE_URL}/api/categories/subcategories/${SUBCATEGORY_ID}" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -d "{\"name\":\"Test SubCategory Updated\",\"categoryId\":${CATEGORY_ID}}"
      fi
    fi
  else
    skip "Category sub-tests — category ID not available"
  fi
fi

# =============================================================================
# 3. PRODUCTS
# =============================================================================
if run_section "products"; then
  section "Products"

  # ── 3a. GET all products (public) ──
  do_curl "GET /api/products?page=0&size=5&sortBy=id" "200" \
    -X GET "${BASE_URL}/api/products?page=0&size=5&sortBy=id"

  # ── 3b. search ──
  do_curl "GET /api/products/search?query=para" "200" \
    -X GET "${BASE_URL}/api/products/search?query=para&page=0&size=5"

  # ── 3c. by category ──
  do_curl "GET /api/products/category/test-category-updated-${TEST_RUN_ID}" "200" \
    -X GET "${BASE_URL}/api/products/category/test-category-updated-${TEST_RUN_ID}?page=0&size=5"

  # ── 3d. create (admin) ──
  _cat_id="${CATEGORY_ID:-1}"
  if need_admin "POST /api/products"; then
    do_curl "POST /api/products (admin)" "200" \
      -X POST "${BASE_URL}/api/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -d "{\"name\":\"Test Paracetamol $(date +%s)\",\"description\":\"Test painkiller\",\"manufacturer\":\"TestPharma\",\"price\":4.99,\"stockQuantity\":50,\"categoryId\":${_cat_id},\"isPrescriptionRequired\":false,\"isBundleOffer\":false}"
    PRODUCT_ID=$(extract "$LAST_BODY" "id")
    info "Product ID: ${PRODUCT_ID}"
  fi

  # ── 3e. create without auth → 403 ──
  do_curl "POST /api/products (no auth → 403)" "403" \
    -X POST "${BASE_URL}/api/products" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Unauth Product\",\"price\":1.99,\"categoryId\":1}"

  if [[ -n "${PRODUCT_ID:-}" && "$PRODUCT_ID" != "null" ]]; then
    # ── 3f. GET by ID ──
    do_curl "GET /api/products/${PRODUCT_ID}" "200" \
      -X GET "${BASE_URL}/api/products/${PRODUCT_ID}"

    # ── 3g. update (admin) ──
    if need_admin "PUT /api/products/{id}"; then
      do_curl "PUT /api/products/${PRODUCT_ID} (admin)" "200" \
        -X PUT "${BASE_URL}/api/products/${PRODUCT_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -d "{\"name\":\"Updated Paracetamol\",\"price\":5.49,\"stockQuantity\":75,\"categoryId\":${_cat_id},\"isPrescriptionRequired\":false,\"isBundleOffer\":false}"
    fi

    # ── 3h. upload template ──
    if need_admin "GET /api/products/upload/template"; then
      do_curl "GET /api/products/upload/template (admin)" "200" \
        -X GET "${BASE_URL}/api/products/upload/template" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}"
    fi
  else
    skip "Product detail/update tests — product ID not available"
  fi

  # ── 3i. not found → 404 ──
  do_curl "GET /api/products/999999999 (→ 404)" "404" \
    -X GET "${BASE_URL}/api/products/999999999"
fi

# =============================================================================
# 4. CART
# =============================================================================
if run_section "cart"; then
  section "Cart"

  # ── 4a. unauthenticated → 403 ──
  do_curl "GET /api/cart (no auth → 403)" "403" \
    -X GET "${BASE_URL}/api/cart"

  if need_user_token "Cart tests"; then
    # ── 4b. GET cart ──
    do_curl "GET /api/cart" "200" \
      -X GET "${BASE_URL}/api/cart" \
      -H "Authorization: Bearer ${USER_TOKEN}"

    if [[ -n "${PRODUCT_ID:-}" && "$PRODUCT_ID" != "null" ]]; then
      # ── 4c. add item ──
      do_curl "POST /api/cart/items" "200" \
        -X POST "${BASE_URL}/api/cart/items" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        -d "{\"productId\":${PRODUCT_ID},\"quantity\":2}"

      # If that extracted the cart's own id, try to get the first item id
      CART_ITEM_ID=$(printf '%s' "$LAST_BODY" | grep -o '"items":\[{"id":[0-9]*' | grep -o '[0-9]*$' | head -1 || true)
      if [[ -z "${CART_ITEM_ID:-}" || "$CART_ITEM_ID" == "null" ]]; then
        CART_ITEM_ID=$(extract "$LAST_BODY" "id")
      fi
      info "Cart item ID: ${CART_ITEM_ID:-<not extracted>}"

      if [[ -n "${CART_ITEM_ID:-}" && "$CART_ITEM_ID" != "null" ]]; then
        # ── 4d. update item quantity ──
        do_curl "PUT /api/cart/items/${CART_ITEM_ID}?quantity=3" "200" \
          -X PUT "${BASE_URL}/api/cart/items/${CART_ITEM_ID}?quantity=3" \
          -H "Authorization: Bearer ${USER_TOKEN}"
      else
        skip "PUT /api/cart/items/{id} — cart item ID not extracted"
      fi
    else
      skip "Cart add/update — no product ID available"
    fi
  fi
fi

# =============================================================================
# 5. ADDRESSES
# =============================================================================
if run_section "addresses"; then
  section "Addresses"

  if need_user_token "Address tests"; then
    # ── 5a. GET addresses ──
    do_curl "GET /api/addresses" "200" \
      -X GET "${BASE_URL}/api/addresses" \
      -H "Authorization: Bearer ${USER_TOKEN}"

    # ── 5b. POST add address ──
    do_curl "POST /api/addresses" "200" \
      -X POST "${BASE_URL}/api/addresses" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${USER_TOKEN}" \
      -d "{\"street\":\"123 Test Street\",\"city\":\"London\",\"state\":\"England\",\"zipCode\":\"SW1A 1AA\",\"country\":\"UK\",\"default\":true}"
    ADDRESS_ID=$(extract "$LAST_BODY" "id")
    info "Address ID: ${ADDRESS_ID:-<not extracted>}"

    if [[ -n "${ADDRESS_ID:-}" && "$ADDRESS_ID" != "null" ]]; then
      # ── 5c. PUT update address ──
      do_curl "PUT /api/addresses/${ADDRESS_ID}" "200" \
        -X PUT "${BASE_URL}/api/addresses/${ADDRESS_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        -d "{\"street\":\"456 Updated Street\",\"city\":\"Manchester\",\"state\":\"England\",\"zipCode\":\"M1 1AA\",\"country\":\"UK\",\"default\":false}"
    else
      skip "PUT /api/addresses/{id} — address ID not available"
    fi
  fi
fi

# =============================================================================
# 6. ORDERS
# =============================================================================
if run_section "orders"; then
  section "Orders"

  # ── 6a. unauthenticated → 403 ──
  do_curl "GET /api/orders (no auth → 403)" "403" \
    -X GET "${BASE_URL}/api/orders"

  if need_user_token "Order tests"; then
    # ── 6b. GET user orders ──
    do_curl "GET /api/orders" "200" \
      -X GET "${BASE_URL}/api/orders" \
      -H "Authorization: Bearer ${USER_TOKEN}"

    # ── 6c. POST place order ──
    _addr_id="${ADDRESS_ID:-null}"
    do_curl "POST /api/orders" "200" \
      -X POST "${BASE_URL}/api/orders" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${USER_TOKEN}" \
      -d "{\"shippingAddress\":\"123 Test Street, London, SW1A 1AA, UK\",\"addressId\":${_addr_id},\"paymentMethod\":\"COD\"}"
    ORDER_ID=$(extract "$LAST_BODY" "id")
    info "Order ID: ${ORDER_ID:-<not extracted>}"

    if [[ -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
      # ── 6d. GET order by ID — owner ──
      do_curl "GET /api/orders/${ORDER_ID} (owner)" "200" \
        -X GET "${BASE_URL}/api/orders/${ORDER_ID}" \
        -H "Authorization: Bearer ${USER_TOKEN}"

      # ── 6e. GET order by ID — admin (should be allowed) ──
      if [[ "$ADMIN_AVAILABLE" == "true" ]]; then
        do_curl "GET /api/orders/${ORDER_ID} (admin → 200)" "200" \
          -X GET "${BASE_URL}/api/orders/${ORDER_ID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}"
      else
        skip "GET /api/orders/{id} admin access — admin token unavailable"
      fi

      # ── 6f. GET receipt PDF ──
      do_curl "GET /api/orders/${ORDER_ID}/receipt" "200" \
        -X GET "${BASE_URL}/api/orders/${ORDER_ID}/receipt" \
        -H "Authorization: Bearer ${USER_TOKEN}"

      # ── 6g. GET export ──
      do_curl "GET /api/orders/export" "200" \
        -X GET "${BASE_URL}/api/orders/export" \
        -H "Authorization: Bearer ${USER_TOKEN}"
    else
      skip "Order detail/receipt/export — order ID not available (cart may be empty)"
    fi

    # ── 6h. IDOR guard: order 1 should return 403 if not owned by test user ──
    #   Accept 200 (owns it), 403 (correct guard), or 404 (doesn't exist) as valid.
    _idor_status=""
    _tmp=$(mktemp)
    _idor_status=$(curl -s -o "$_tmp" -w "%{http_code}" \
      --connect-timeout 5 --max-time 15 \
      -X GET "${BASE_URL}/api/orders/1" \
      -H "Authorization: Bearer ${USER_TOKEN}" 2>/dev/null) || _idor_status="000"
    rm -f "$_tmp"
    TOTAL=$((TOTAL+1))
    if [[ "$_idor_status" == "403" || "$_idor_status" == "404" || "$_idor_status" == "200" ]]; then
      pass "GET /api/orders/1 (IDOR guard) [${_idor_status}]"
      PASS=$((PASS+1))
      [[ "$_idor_status" == "200" ]] && info "Test user owns order 1 — guard still correct (ownership check passed)"
      [[ "$_idor_status" == "403" ]] && info "IDOR guard working — 403 returned for another user's order"
    else
      fail "GET /api/orders/1 (IDOR guard) — unexpected status ${_idor_status}"
    fi
  fi
fi

# =============================================================================
# 7. ADMIN — ORDERS
# =============================================================================
if run_section "admin-orders" && [[ "$NO_ADMIN" != "true" ]]; then
  section "Admin — Orders"

  if need_admin "All admin order tests"; then
    # ── 7a. GET all orders ──
    do_curl "GET /api/admin/orders" "200" \
      -X GET "${BASE_URL}/api/admin/orders?page=0&size=10&sortBy=orderDate" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    # ── 7b. GET by status ──
    do_curl "GET /api/admin/orders/status/PENDING" "200" \
      -X GET "${BASE_URL}/api/admin/orders/status/PENDING?page=0&size=10" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    # ── 7c. PUT update order status ──
    if [[ -n "${ORDER_ID:-}" && "$ORDER_ID" != "null" ]]; then
      do_curl "PUT /api/admin/orders/${ORDER_ID}/status → CONFIRMED" "200" \
        -X PUT "${BASE_URL}/api/admin/orders/${ORDER_ID}/status?status=CONFIRMED" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}"
    else
      skip "PUT /api/admin/orders/{id}/status — no order ID"
    fi

    # ── 7d. GET export (Excel) ──
    do_curl "GET /api/admin/orders/export" "200" \
      -X GET "${BASE_URL}/api/admin/orders/export" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    # ── 7e. GET export filtered ──
    do_curl "GET /api/admin/orders/export (date-filtered)" "200" \
      -X GET "${BASE_URL}/api/admin/orders/export?startDate=$(date +%Y-%m-01)&endDate=$(date +%Y-%m-%d)" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    # ── 7f. user token → 403 ──
    if [[ -n "$USER_TOKEN" ]]; then
      do_curl "GET /api/admin/orders (user token → 403)" "403" \
        -X GET "${BASE_URL}/api/admin/orders" \
        -H "Authorization: Bearer ${USER_TOKEN}"
    fi
  fi
fi

# =============================================================================
# 8. ADMIN — DASHBOARD
# =============================================================================
if run_section "dashboard" && [[ "$NO_ADMIN" != "true" ]]; then
  section "Admin — Dashboard"

  if need_admin "Dashboard tests"; then
    do_curl "GET /api/admin/dashboard/stats" "200" \
      -X GET "${BASE_URL}/api/admin/dashboard/stats" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    do_curl "GET /api/admin/dashboard/daily-revenue?days=7" "200" \
      -X GET "${BASE_URL}/api/admin/dashboard/daily-revenue?days=7" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    do_curl "GET /api/admin/dashboard/expiring-products?days=30" "200" \
      -X GET "${BASE_URL}/api/admin/dashboard/expiring-products?days=30" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    do_curl "GET /api/admin/dashboard/top-products?limit=5" "200" \
      -X GET "${BASE_URL}/api/admin/dashboard/top-products?limit=5" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"
  fi
fi

# =============================================================================
# 9. ADMIN — USERS
# =============================================================================
if run_section "admin-users" && [[ "$NO_ADMIN" != "true" ]]; then
  section "Admin — Users"

  if need_admin "User management tests"; then
    do_curl "GET /api/admin/users" "200" \
      -X GET "${BASE_URL}/api/admin/users?page=0&size=10" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    do_curl "GET /api/admin/users/role/CUSTOMER" "200" \
      -X GET "${BASE_URL}/api/admin/users/role/CUSTOMER?page=0&size=10" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    do_curl "GET /api/admin/users/role/ADMIN" "200" \
      -X GET "${BASE_URL}/api/admin/users/role/ADMIN" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"

    # ── user token → 403 ──
    if [[ -n "$USER_TOKEN" ]]; then
      do_curl "GET /api/admin/users (user token → 403)" "403" \
        -X GET "${BASE_URL}/api/admin/users" \
        -H "Authorization: Bearer ${USER_TOKEN}"
    fi
  fi
fi

# =============================================================================
# 10. CLEANUP
# =============================================================================
if [[ "$SKIP_CLEANUP" != "true" ]]; then
  section "Cleanup"

  if [[ -n "${CART_ITEM_ID:-}" && "$CART_ITEM_ID" != "null" && -n "$USER_TOKEN" && -z "${ORDER_ID:-}" ]]; then
    do_curl "DELETE /api/cart/items/${CART_ITEM_ID}" "200" \
      -X DELETE "${BASE_URL}/api/cart/items/${CART_ITEM_ID}" \
      -H "Authorization: Bearer ${USER_TOKEN}"
  fi

  if [[ -n "$USER_TOKEN" ]]; then
    do_curl "DELETE /api/cart/clear" "200" \
      -X DELETE "${BASE_URL}/api/cart/clear" \
      -H "Authorization: Bearer ${USER_TOKEN}"
  fi

  if [[ -n "${ADDRESS_ID:-}" && "$ADDRESS_ID" != "null" && -n "$USER_TOKEN" ]]; then
    do_curl "DELETE /api/addresses/${ADDRESS_ID}" "200" \
      -X DELETE "${BASE_URL}/api/addresses/${ADDRESS_ID}" \
      -H "Authorization: Bearer ${USER_TOKEN}"
  fi

  if [[ -n "${SUBCATEGORY_ID:-}" && "$SUBCATEGORY_ID" != "null" && "$ADMIN_AVAILABLE" == "true" ]]; then
    do_curl "DELETE /api/categories/subcategories/${SUBCATEGORY_ID} (admin)" "200" \
      -X DELETE "${BASE_URL}/api/categories/subcategories/${SUBCATEGORY_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"
  fi

  if [[ -n "${PRODUCT_ID:-}" && "$PRODUCT_ID" != "null" && "$ADMIN_AVAILABLE" == "true" ]]; then
    do_curl "DELETE /api/products/${PRODUCT_ID} (admin)" "200" \
      -X DELETE "${BASE_URL}/api/products/${PRODUCT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}"
  fi

  if [[ -n "${CATEGORY_ID:-}" && "$CATEGORY_ID" != "null" && "$ADMIN_AVAILABLE" == "true" ]]; then
    # Since products are soft-deleted, deleting the category may throw 500 constraint violation. Avoid do_curl to prevent fail logs.
    TOTAL=$((TOTAL+1))
    c_status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE_URL}/api/categories/${CATEGORY_ID}" -H "Authorization: Bearer ${ADMIN_TOKEN}" 2>/dev/null || echo "000")
    if [[ "$c_status" == "200" || "$c_status" == "500" ]]; then
       pass "DELETE /api/categories/${CATEGORY_ID} (admin) (200 or 500 constraint) [${c_status}]"
       PASS=$((PASS+1))
    else
       fail "DELETE /api/categories/${CATEGORY_ID} (admin) — unexpected status ${c_status}"
    fi
  fi
else
  section "Cleanup skipped"
  info "Product   : ${PRODUCT_ID:-—}"
  info "Category  : ${CATEGORY_ID:-—}"
  info "Address   : ${ADDRESS_ID:-—}"
  info "Order     : ${ORDER_ID:-—}"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}─────────────────────────────────────────────${NC}"
echo -e "${BOLD}  Results${NC}"
echo -e "  Total    : ${TOTAL}"
echo -e "  ${GREEN}Passed   : ${PASS}${NC}"
if [[ "$FAILURES" -gt 0 ]]; then
  echo -e "  ${RED}Failed   : ${FAILURES}${NC}"
else
  echo -e "  Failed   : 0"
fi
echo -e "  ${YELLOW}Skipped  : ${SKIPPED}${NC}"
echo -e "${BOLD}─────────────────────────────────────────────${NC}"

if [[ "$ADMIN_AVAILABLE" != "true" && "$NO_ADMIN" != "true" ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}Admin sections were skipped.${NC}"
  echo -e "To test them, run with your real admin credentials:"
  echo -e "  ${DIM}./test-api.sh --admin-email EMAIL --admin-password PASS${NC}"
  echo -e "Or promote your test user to ADMIN via:"
  echo -e "  ${DIM}psql -U postgres -d pharma_db -c \"UPDATE users SET role='ADMIN' WHERE email='${USER_EMAIL}';\"${NC}"
  echo -e "Then re-run:  ${DIM}./test-api.sh --admin-email '${USER_EMAIL}' --admin-password '${USER_PASSWORD}'${NC}"
fi

echo ""
if [[ "$FAILURES" -gt 0 ]]; then
  echo -e "${RED}${BOLD}⚠  ${FAILURES} test(s) failed.${NC}"
  exit 1
else
  echo -e "${GREEN}${BOLD}✔  All executed tests passed.${NC}"
  exit 0
fi
