# Monitoring Configuration

This directory contains all monitoring and observability configurations for the Pharmaceutical Stockist application.

## Files

- **prometheus.yml** - Prometheus scraping configuration
- **alert-rules.yml** - Alert rules for application monitoring
- **alertmanager.yml** - Alertmanager configuration (IMPORTANT: Add your Gmail credentials!)
- **grafana-datasources.yml** - Grafana datasource provisioning
- **promtail-config.yml** - Log collection configuration
- **Loki**: http://localhost:3100 (External) / http://loki:3100 (Internal Docker Network)

## Setup Instructions

### 1. Configure Gmail Alerting

Edit `alertmanager.yml` and replace:
- `YOUR_EMAIL@gmail.com` with your Gmail address
- `YOUR_16_CHAR_APP_PASSWORD` with your Gmail App Password

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Create password for "Mail" → "Other" (name it "Alertmanager")
5. Copy the 16-character password

### 2. Security

**NEVER commit `alertmanager.yml` with real credentials!**

The file is already in `.gitignore` for safety.

### 3. Start Monitoring Stack

```bash
docker-compose up -d
```

### 4. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090 (External) / http://prometheus:9090 (Internal Docker Network)
- **Alertmanager**: http://localhost:9093

### 5. Import Grafana Dashboard

1. Login to Grafana
2. Go to Dashboards → Import
3. Enter ID: `12900` (Spring Boot 2.1 Statistics)
4. Select Prometheus datasource
5. Import

## Alert Rules

Current alerts:
- **HighErrorRate**: >5% error rate for 2 minutes
- **SlowResponseTime**: Average response >2s for 5 minutes
- **ServiceDown**: Backend unreachable for 1 minute
- **HighMemoryUsage**: JVM heap >90% for 5 minutes

## Testing Alerts

Stop the backend to trigger `ServiceDown` alert:
```bash
docker-compose stop backend
```

You should receive an email within 1-2 minutes.
