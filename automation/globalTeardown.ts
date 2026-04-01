import { execSync } from 'child_process';

/**
 * Playwright global teardown — runs once after all tests complete.
 *
 * Deletes all data created by automation tests:
 *   - Users whose emails match the *@test.com pattern used by every spec file
 *   - Their associated orders, order items, cart, cart items, and addresses
 *   - Test products identified by the manufacturer names hardcoded in spec files
 *
 * Runs SQL directly against the postgres container so no backend DELETE
 * endpoints are needed. Safe to run against the dev stack only.
 */

const TEST_EMAIL_PATTERN = '%@test.com';

  'Pharma Cart Inc',   // cart.spec.ts
  'PharmaTest Inc',    // core.spec.ts, profile.spec.ts
  'LimitedStockCo',    // profile.spec.ts
  'MasterFlow Corp',   // master-flow.spec.ts
  'ReceiptCo',         // receipt.spec.ts
  'CancelCorp',        // order-cancellation.spec.ts
  'Test Lab',          // product-management.spec.ts
];

const manufacturerList = TEST_MANUFACTURERS.map(m => `'${m}'`).join(', ');

const sql = [
  // 1. Cart items for test users' carts
  `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}'))`,
  // 2. Cart items referencing test products (from any user — catches cross-references)
  `DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE manufacturer IN (${manufacturerList}))`,
  // 3. Carts for test users
  `DELETE FROM carts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}')`,
  // 4. Order items for test users' orders
  `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}'))`,
  // 5. Order items referencing test products (from any order — catches cross-references)
  `DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE manufacturer IN (${manufacturerList}))`,
  // 6. Orders for test users
  `DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}')`,
  // 7. Addresses for test users
  `DELETE FROM addresses WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}')`,
  // 8. Test users
  `DELETE FROM users WHERE email LIKE '${TEST_EMAIL_PATTERN}'`,
  // 9. Product images for test products (ElementCollection table)
  `DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE manufacturer IN (${manufacturerList}))`,
  // 10. Test products
  `DELETE FROM products WHERE manufacturer IN (${manufacturerList})`,
].map(s => `-c "${s}"`).join(' ');

async function globalTeardown() {
  console.log('\n🧹 Cleaning up automation test data...');

  try {
    execSync('docker exec pharma-db psql -U postgres -d pharma_db', {
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log('✅ Test data cleaned up successfully.\n');
  } catch (error: any) {
    // Non-zero exit from psql (e.g. stack not running) should not fail the test run
    console.warn('⚠️  Test data cleanup failed (is the stack running?):', error.stderr?.toString() || error.message);
  }
}

export default globalTeardown;
