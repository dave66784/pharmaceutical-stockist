const fs = require('fs');
const path = require('path');

const TESTS_DIR = '/Users/saurabhdave/Developer/Workspace/pharmaceutical-stockist/automation/tests';

function addAuthToGet() {
    ['cart.spec.ts', 'core.spec.ts', 'master-flow.spec.ts'].forEach(file => {
        let content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');

        // Add header to request.get
        content = content.replace(
            /const catRes = await request\.get\('\/api\/categories'\);/g,
            "const catRes = await request.get('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });"
        );

        fs.writeFileSync(path.join(TESTS_DIR, file), content);
    });
}

addAuthToGet();
console.log("Specs updated with auth header!");
