# Deployment

## Production build

```bash
# 1. Build the Vue SPA
npm run build --prefix client    # outputs to client/dist/

# 2. Compile the server
npm run build --prefix server    # outputs to server/dist/

# 3. Start
cd server && NODE_ENV=production npm start
```

When `NODE_ENV=production`, Express serves `client/dist/` as static files and falls back to `index.html` for all non-API routes so Vue Router's history mode works correctly. No separate static server or reverse proxy is required for simple deployments.

## Sub-path deployment

If you need the app to live under a path prefix (e.g. `https://yoursite.com/booking`):

```bash
# Build the client with the base path
VITE_BASE_URL=/booking npm run build --prefix client
```

This sets Vite's `base` option so all asset URLs are prefixed correctly. Configure your reverse proxy to forward requests under `/booking` to the server.

## Environment variables

Create `server/.env` from `server/.env.example`:

```bash
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://yoursite.com,https://www.yoursite.com
# Optional: override business hours per tenant
# TENANT_CONFIG={"openTime":"08:00","closeTime":"17:00","timezone":"Europe/Paris"}
```

See [configuration.md](configuration.md) for the full reference.

## Reverse proxy (optional)

For TLS termination or running behind nginx/Caddy, proxy both HTTP and WebSocket traffic to the server:

```nginx
location / {
    proxy_pass         http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
}
```
