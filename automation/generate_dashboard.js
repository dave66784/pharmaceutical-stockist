const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'results.json');
const outputPath = path.join(__dirname, 'dashboard.html');

if (!fs.existsSync(resultsPath)) {
    console.error('Error: results.json not found. Run tests first.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Extract stats
const stats = data.stats;
const suites = data.suites || [];

// Helper to format duration
const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

// Generate test rows
let testRows = '';
let totalTests = 0;
let plusTests = 0;
let minusTests = 0;

function processSuite(suite, parentTitle = '') {
    const fullTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    if (suite.specs) {
        suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
                totalTests++;
                const result = test.results[0];
                const status = result.status;
                const statusClass = status === 'passed' ? 'status-pass' : 'status-fail';
                const statusIcon = status === 'passed' ? '✓' : '✗';

                testRows += `
                    <tr>
                        <td><span class="status-badge ${statusClass}">${statusIcon} ${status.toUpperCase()}</span></td>
                        <td>
                            <div class="test-title">${spec.title}</div>
                            <div class="test-suite">${fullTitle}</div>
                        </td>
                        <td>${test.projectName}</td>
                        <td>${formatDuration(result.duration)}</td>
                    </tr>
                `;
            });
        });
    }

    if (suite.suites) {
        suite.suites.forEach(s => processSuite(s, fullTitle));
    }
}

suites.forEach(s => processSuite(s));

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pharma Stockist | Automation Dashboard</title>
    <style>
        :root {
            --primary: #2563eb;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            background: var(--bg); 
            color: var(--text-main);
            line-height: 1.5;
            padding: 2rem;
        }

        .container { max-width: 1200px; margin: 0 auto; }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border);
        }

        .logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.025em; }
        .timestamp { font-size: 0.875rem; color: var(--text-muted); }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid var(--border);
        }

        .stat-label { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2rem; font-weight: 700; }
        .stat-value.success { color: var(--success); }
        .stat-value.danger { color: var(--danger); }

        .report-section {
            background: var(--card-bg);
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid var(--border);
            overflow: hidden;
        }

        table { width: 100%; border-collapse: collapse; }
        th { 
            background: #f1f5f9; 
            text-align: left; 
            padding: 1rem; 
            font-size: 0.75rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            color: var(--text-muted);
        }
        td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }

        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .status-pass { background: #d1fae5; color: #065f46; }
        .status-fail { background: #fee2e2; color: #991b1b; }

        .test-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
        .test-suite { font-size: 0.875rem; color: var(--text-muted); }

        .footer {
            margin-top: 3rem;
            text-align: center;
            font-size: 0.875rem;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">PHARMA STOCKIST <span style="font-weight: 300;">| TEST REPORT</span></div>
            <div class="timestamp">Generated: ${new Date(stats.startTime).toLocaleString()}</div>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">TOTAL TESTS</div>
                <div class="stat-value">${stats.expected + stats.unexpected + stats.skipped}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">PASSED</div>
                <div class="stat-value success">${stats.expected}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">FAILED</div>
                <div class="stat-value danger">${stats.unexpected}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">DURATION</div>
                <div class="stat-value">${formatDuration(stats.duration)}</div>
            </div>
        </div>

        <div class="report-section">
            <table>
                <thead>
                    <tr>
                        <th style="width: 120px;">Status</th>
                        <th>Test Case</th>
                        <th>Browser</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${testRows}
                </tbody>
            </table>
        </div>

        <div class="footer">
            &copy; 2026 Pharmaceutical Stockist Automation Dashboard. Built with ❤️ and Vanilla JS.
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(outputPath, htmlContent);
console.log('Dashboard generated successfully: ' + outputPath);
