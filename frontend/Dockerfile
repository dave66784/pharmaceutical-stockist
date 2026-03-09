FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Copy to a shared volume when the container runs
CMD mkdir -p /output && rm -rf /output/* && cp -a dist/. /output/ && echo "Built and copied to /output" && tail -f /dev/null
