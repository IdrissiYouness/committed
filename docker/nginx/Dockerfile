# ── Stage 1: Build the React frontend ───────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# ── Stage 2: Nginx with everything bundled ──────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built React app
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy Scalar API docs UI
COPY docker/nginx/scalar.html /usr/share/nginx/html/docs/scalar.html

# Copy OpenAPI spec
COPY docs/openapi.yaml /usr/share/nginx/html/docs/openapi.yaml

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
