const fs = require('fs');
const path = require('path');

const TESTS_DIR = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/automation/tests';

function fixCartSpec() {
    let content = fs.readFileSync(path.join(TESTS_DIR, 'cart.spec.ts'), 'utf-8');

    // Replace beforeAll setup
    content = content.replace(
        /const token = loginData\.data\.token;[\s\S]*?await request\.post\('\/api\/products'/,
        `const token = loginData.data.token;

        // Fetch category to use
        const catRes = await request.get('/api/categories');
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 2. Create Product
        await request.post('/api/products'`
    );

    // Add variable
    content = content.replace(
        "const productName = `Cart Test Product ${Date.now()}`;",
        "const productName = `Cart Test Product ${Date.now()}`;\nlet testCategorySlug = '';"
    );

    // Replace product creation payload
    content = content.replace(
        "category: 'OTHER',",
        "categoryId: firstCat.id,"
    );

    // Replace filtering
    content = content.replace(
        /selectOption\('OTHER'\)/g,
        "selectOption(testCategorySlug)"
    );

    fs.writeFileSync(path.join(TESTS_DIR, 'cart.spec.ts'), content);
}

function fixCoreSpec() {
    let content = fs.readFileSync(path.join(TESTS_DIR, 'core.spec.ts'), 'utf-8');

    content = content.replace(
        "const productName = `Test Product ${Date.now()}`;",
        "const productName = `Test Product ${Date.now()}`;\nlet testCategorySlug = '';"
    );

    content = content.replace(
        /const token = loginData\.data\.token;[\s\S]*?expect\(token\)\.toBeTruthy\(\);[\s\S]*?\/\/ 2\. Create Product[\s\S]*?const productRes = await request\.post\('\/api\/products'/,
        `const token = loginData.data.token;
        expect(token).toBeTruthy();

        const catRes = await request.get('/api/categories');
        const catData = await catRes.json();
        const firstCat = catData.data[0];
        testCategorySlug = firstCat.slug;

        // 2. Create Product
        const productRes = await request.post('/api/products'`
    );

    content = content.replace(
        "category: 'OTHER',",
        "categoryId: firstCat.id,"
    );

    content = content.replace(
        /selectOption\('OTHER'\)/g,
        "selectOption(testCategorySlug)"
    );

    fs.writeFileSync(path.join(TESTS_DIR, 'core.spec.ts'), content);
}

function fixMasterFlowSpec() {
    let content = fs.readFileSync(path.join(TESTS_DIR, 'master-flow.spec.ts'), 'utf-8');

    content = content.replace(
        /const token = loginData\.data\.token;[\s\S]*?await request\.post\('\/api\/products'/,
        `const token = loginData.data.token;

    const catRes = await request.get('/api/categories');
    const catData = await catRes.json();
    const firstCat = catData.data[0];
    const testCategorySlug = firstCat.slug;

    await request.post('/api/products'`
    );

    content = content.replace(
        "category: 'OTHER',",
        "categoryId: firstCat.id,"
    );

    content = content.replace(
        "selectOption('OTHER')",
        "selectOption(testCategorySlug)"
    );

    fs.writeFileSync(path.join(TESTS_DIR, 'master-flow.spec.ts'), content);
}

fixCartSpec();
fixCoreSpec();
fixMasterFlowSpec();
console.log("Specs updated!");
