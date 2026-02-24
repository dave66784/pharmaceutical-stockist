const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Constants
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const AUTOMATION_DIR = path.join(ROOT_DIR, 'automation');
const REPORT_FILE = path.join(ROOT_DIR, 'unified-test-report.html');

let results = {
    junit: { total: 0, passed: 0, failed: 0, skipped: 0, time: 0 },
    api: { total: 0, passed: 0, failed: 0, time: 0, details: [] },
    ui: { total: 0, passed: 0, failed: 0, skipped: 0, time: 0 }
};

// 1. Run JUnit Tests
console.log('Running Backend JUnit Tests...');
try {
    execSync('mvn -B test', { cwd: BACKEND_DIR, stdio: 'ignore' });
} catch (e) {
    console.log('Some JUnit tests failed.');
}

// Parse JUnit results
const surefireDir = path.join(BACKEND_DIR, 'target', 'surefire-reports');
if (fs.existsSync(surefireDir)) {
    const files = fs.readdirSync(surefireDir).filter(f => f.endsWith('.xml'));
    for (const file of files) {
        const content = fs.readFileSync(path.join(surefireDir, file), 'utf8');
        // Hacks regex parsing for speed
        const testsuiteMatch = content.match(/<testsuite[^>]+>/);
        if (testsuiteMatch) {
            const attr = (name) => {
                const match = testsuiteMatch[0].match(new RegExp(`${name}="([^"]+)"`));
                return match ? parseFloat(match[1]) : 0;
            };
            results.junit.total += attr('tests');
            results.junit.failed += attr('failures') + attr('errors');
            results.junit.skipped += attr('skipped');
            results.junit.time += attr('time');
        }
    }
    results.junit.passed = results.junit.total - results.junit.failed - results.junit.skipped;
}

// 2. Run API Tests (Curl)
console.log('Running API Tests using cURL...');
const apiStartTime = Date.now();
const curlTests = [
    { name: 'Get All Products', cmd: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/products?page=0&size=12`, expected: '200' },
    { name: 'Filter Vaccines by SubCategory Tdap', cmd: `curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/products/category/VACCINES?page=0&size=12&subCategory=Tdap"`, expected: '200' },
    // A quick content verification test using jq
    { name: 'Verify Tdap Results Count = 1', cmd: `curl -s "http://localhost:8080/api/products/category/VACCINES?page=0&size=12&subCategory=Tdap" | jq -r '.data.totalElements'`, expected: '1' }
];

for (const test of curlTests) {
    results.api.total++;
    try {
        const output = execSync(test.cmd, { encoding: 'utf8' }).trim();
        if (output === test.expected) {
            results.api.passed++;
            results.api.details.push({ name: test.name, status: 'Passed' });
        } else {
            results.api.failed++;
            results.api.details.push({ name: test.name, status: `Failed (Expected ${test.expected}, Got ${output})` });
        }
    } catch (e) {
        results.api.failed++;
        results.api.details.push({ name: test.name, status: `Failed (Error executing command)` });
    }
}
results.api.time = (Date.now() - apiStartTime) / 1000;

// 3. Run Playwright UI Tests
console.log('Running Playwright UI Tests...');
try {
    // Generate JSON report
    execSync('npx playwright test tests/core.spec.ts --project=chromium --reporter=json', {
        cwd: AUTOMATION_DIR,
        stdio: 'ignore',
        env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'results.json' }
    });
} catch (e) {
    console.log('Some Playwright tests failed or exited with code 1. Reading results...');
}

const pwReportPath = path.join(AUTOMATION_DIR, 'results.json');
if (fs.existsSync(pwReportPath)) {
    const pwData = JSON.parse(fs.readFileSync(pwReportPath, 'utf8'));
    results.ui.total = pwData.stats.expected + pwData.stats.unexpected + pwData.stats.flaky + pwData.stats.skipped;
    results.ui.passed = pwData.stats.expected;
    results.ui.failed = pwData.stats.unexpected;
    results.ui.skipped = pwData.stats.skipped;
    results.ui.time = pwData.stats.duration / 1000;
} else {
    console.log('Playwright results.json not found!');
}

// Generate HTML
function getStatusBadge(failed, passed, total) {
    if (total === 0) return `<span class="badge badge-warning">No Tests Running</span>`;
    if (failed > 0) return `<span class="badge badge-error">${failed} Failed</span>`;
    return `<span class="badge badge-success">Passing</span>`;
}

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f6f8; color: #333; margin: 0; padding: 2rem; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
        .card { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 1.5rem; }
        .card h2 { margin-top: 0; font-size: 1.25rem; color: #2d3748; display: flex; justify-content: space-between; align-items: center; }
        .stats { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
        .stat-row { display: flex; justify-content: space-between; font-size: 0.95rem; }
        .badge { padding: 4px 8px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .badge-success { background: #def7ec; color: #03543f; }
        .badge-error { background: #fde8e8; color: #9b1c1c; }
        .badge-warning { background: #fef4cd; color: #7b5a03; }
        .api-details { margin-top: 1rem; font-size: 0.85rem; border-top: 1px solid #edf2f7; padding-top: 1rem; }
        .api-details li { margin-bottom: 0.25rem; }
        .pass-text { color: #046c4e; }
        .fail-text { color: #c81e1e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Unified Test Execution Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        
        <div class="grid">
            <!-- Backend -->
            <div class="card">
                <h2>📦 Backend (JUnit) ${getStatusBadge(results.junit.failed, results.junit.passed, results.junit.total)}</h2>
                <div class="stats">
                    <div class="stat-row"><span>Total Tests:</span> <strong>${results.junit.total}</strong></div>
                    <div class="stat-row"><span>Passed:</span> <strong class="pass-text">${results.junit.passed}</strong></div>
                    <div class="stat-row"><span>Failed:</span> <strong class="fail-text">${results.junit.failed}</strong></div>
                    <div class="stat-row"><span>Skipped:</span> <strong>${results.junit.skipped}</strong></div>
                    <div class="stat-row"><span>Duration:</span> <strong>${results.junit.time.toFixed(2)}s</strong></div>
                </div>
            </div>

            <!-- API -->
            <div class="card">
                <h2>🌐 API (cURL) ${getStatusBadge(results.api.failed, results.api.passed, results.api.total)}</h2>
                <div class="stats">
                    <div class="stat-row"><span>Total Tests:</span> <strong>${results.api.total}</strong></div>
                    <div class="stat-row"><span>Passed:</span> <strong class="pass-text">${results.api.passed}</strong></div>
                    <div class="stat-row"><span>Failed:</span> <strong class="fail-text">${results.api.failed}</strong></div>
                    <div class="stat-row"><span>Duration:</span> <strong>${results.api.time.toFixed(2)}s</strong></div>
                </div>
                <div class="api-details">
                    <ul style="padding-left: 1rem; margin: 0;">
                        ${results.api.details.map(d => `<li>${d.name}: <span class="${d.status.includes('Passed') ? 'pass-text' : 'fail-text'}">${d.status}</span></li>`).join('')}
                    </ul>
                </div>
            </div>

            <!-- Frontend -->
            <div class="card">
                <h2>🖥️ Frontend (Playwright) ${getStatusBadge(results.ui.failed, results.ui.passed, results.ui.total)}</h2>
                <div class="stats">
                    <div class="stat-row"><span>Total Tests:</span> <strong>${results.ui.total}</strong></div>
                    <div class="stat-row"><span>Passed:</span> <strong class="pass-text">${results.ui.passed}</strong></div>
                    <div class="stat-row"><span>Failed:</span> <strong class="fail-text">${results.ui.failed}</strong></div>
                    <div class="stat-row"><span>Skipped:</span> <strong>${results.ui.skipped}</strong></div>
                    <div class="stat-row"><span>Duration:</span> <strong>${results.ui.time.toFixed(2)}s</strong></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(REPORT_FILE, html);
console.log('');
console.log('✅ Unified HTML report generated at:', REPORT_FILE);
