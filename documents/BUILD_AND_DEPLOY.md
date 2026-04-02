
# Build & Deploy Guide

## Prerequisites

- Docker and Docker Compose installed
- `.env` file present in the project root with required secrets (`DB_PASSWORD`, `GRAFANA_PASSWORD`, etc.)

---

## Full Stack Deploy

### First time or clean deploy

```bash
docker compose up --build -d
```

Builds all images and starts all 8 services in the background.

### With tests before deploy

```bash
./scripts/build_and_deploy.sh --test
```

Runs backend unit tests (`mvn test`) and frontend lint before deploying.

### Without tests

```bash
./scripts/build_and_deploy.sh
```

---

## Service-Specific Rebuilds

Use these when you've only changed one layer of the stack and want to avoid rebuilding everything.

### Frontend (UI) only

```bash
docker compose up --build --no-deps frontend
```

Rebuilds the React app and copies the new static files into the shared `frontend-build` volume. Nginx picks them up automatically — no nginx rebuild needed.

### Backend only

```bash
docker compose up --build --no-deps backend
```

### Backend + Frontend (no infra)

```bash
docker compose up --build --no-deps backend frontend
```

---

## Teardown

```bash
# Stop all services (preserves volumes/data)
docker compose down

# Stop and wipe all data volumes (destructive)
docker compose down -v
```

---

## Post-Deploy

### Create admin user

```bash
./scripts/create_admin.sh
```

Must be run after the stack is up. All curl calls run inside the `pharma-backend` container.

### Verify endpoints

```bash
./scripts/test-api.sh
```

Runs 56+ API endpoint tests against the running stack.

---

## Access Points

| Service      | URL                          | Notes                        |
|--------------|------------------------------|------------------------------|
| Frontend     | http://localhost:3000        | React app via nginx          |
| Prometheus   | http://localhost:9090        |                              |
| Grafana      | http://localhost:3001        | Default credentials: admin/admin |
| Alertmanager | http://localhost:9093        |                              |
| PostgreSQL   | localhost:5432               | Internal only                |
| Backend API  | Internal only (port 8080)    | Use `docker exec pharma-backend curl ...` to test directly |

---

## Service Dependency Order

```
postgres (healthy)
  └── backend
        └── frontend
              └── nginx (serves UI on :3000)

prometheus
  └── grafana

loki
  └── promtail
```

---

## Monitoring Stack

The monitoring stack runs alongside the application and requires no custom builds — all images are pulled from Docker Hub.

### Services

| Service      | Container      | Port  | Purpose                                      |
|--------------|----------------|-------|----------------------------------------------|
| Prometheus   | prometheus     | 9090  | Scrapes `/actuator/prometheus` every 15s     |
| Grafana      | grafana        | 3001  | Dashboards; datasources auto-provisioned     |
| Alertmanager | alertmanager   | 9093  | Receives alerts from Prometheus              |
| Loki         | loki           | 3100  | Log aggregation                              |
| Promtail     | promtail       | —     | Ships container logs to Loki                 |

### Restart monitoring only

```bash
docker compose restart prometheus grafana alertmanager loki promtail
```

### Reload Prometheus config without restart

```bash
docker exec prometheus kill -HUP 1
```

### Config file locations

| File                                    | Purpose                              |
|-----------------------------------------|--------------------------------------|
| `monitoring/prometheus.yml`             | Scrape targets and intervals         |
| `monitoring/alert-rules.yml`            | Alert rule definitions               |
| `monitoring/alertmanager.yml`           | Alert routing and receivers          |
| `monitoring/grafana-datasources.yml`    | Grafana datasource auto-provisioning |
| `monitoring/promtail-config.yml`        | Log shipping config                  |

### Alert rules

Defined in `monitoring/alert-rules.yml`. Active rules:

| Alert             | Condition                              | Severity |
|-------------------|----------------------------------------|----------|
| HighErrorRate     | 5xx rate > 0.05/s for 2m              | critical |
| SlowResponseTime  | Avg response > 2s for 5m              | warning  |
| ServiceDown       | Backend unreachable for 1m            | critical |
| HighMemoryUsage   | JVM heap > 90% for 5m                | warning  |

### Email alerts (Alertmanager)

Alertmanager is configured in `monitoring/alertmanager.yml`. Currently routes all alerts to the `null` receiver (silent). To enable Gmail SMTP notifications, update the receiver in that file with your SMTP credentials.

### Grafana first login

- URL: http://localhost:3001
- Default credentials: `admin` / `admin` (or value of `GRAFANA_PASSWORD` in `.env`)
- Prometheus and Loki datasources are auto-provisioned on startup — no manual setup needed.

---

## Troubleshooting

### Check container status

```bash
docker compose ps
```

### View logs for a service

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Test backend API directly

```bash
docker exec pharma-backend curl -s http://localhost:8080/actuator/health
```

### Force full rebuild (clears build cache)

```bash
docker compose build --no-cache
docker compose up -d
```
