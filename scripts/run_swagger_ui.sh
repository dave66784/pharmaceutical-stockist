#!/bin/bash
# Script to run Swagger UI locally for the OAS documentation

# Get the absolute path to the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "Starting Swagger UI on port 8089..."
echo "Open http://localhost:8089 in your browser."

# Stop any existing container
docker stop pharma-swagger-ui 2>/dev/null || true

docker run --rm -d \
  -p 8089:8080 \
  -v "$PROJECT_ROOT/oas:/usr/share/nginx/html/oas" \
  -e SWAGGER_JSON=/usr/share/nginx/html/oas/openapi.yaml \
  --name pharma-swagger-ui \
  swaggerapi/swagger-ui

echo "Swagger UI container (pharma-swagger-ui) is running."
echo "To stop it, run: docker stop pharma-swagger-ui"
