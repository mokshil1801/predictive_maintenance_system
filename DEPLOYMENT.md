# FixAhead Deployment

FixAhead runs as three deployable services:

1. Next.js web app
2. Node.js Express + Socket.IO API
3. FastAPI ML inference service

## Required Environment Variables

Use `.env.example` as the source of truth. Do not commit `.env.local`.

Required for web/API:

```env
MONGO_URL=
MONGO_DB_NAME=fixahead
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=
ALLOWED_ORIGINS=
NEXT_PUBLIC_SOCKET_URL=
REALTIME_EMIT_URL=
REALTIME_INTERNAL_SECRET=
ML_SERVICE_URL=
ML_AUTO_START=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

Required for ML:

```env
MODEL_PATH=/path/to/model.pkl
```

## Build And Start Commands

Install:

```bash
npm ci
python -m pip install -r ml-service/requirements.txt
```

Build web:

```bash
npm run build
```

Start web:

```bash
npm run start:web
```

Start API and realtime server:

```bash
npm run start:api
```

Start ML service:

```bash
npm run start:ml
```

## Health Checks

Web:

```txt
GET /api/health
```

API:

```txt
GET /health
```

ML:

```txt
GET /health
```

## Deployment Notes

- Deploy the web app and API as separate services unless your host supports multiple processes.
- Deploy the ML service separately and set `ML_SERVICE_URL` to that service URL.
- Set `NEXT_PUBLIC_SOCKET_URL` to the public API Socket.IO URL.
- Set `REALTIME_EMIT_URL` to `${API_URL}/internal/emit`.
- Set `ALLOWED_ORIGINS` to the production web URL. Use comma-separated origins only when needed.
- Keep `ML_AUTO_START=false` in production so the Node API does not try to spawn FastAPI inside the API container.
- Twilio WhatsApp sandbox recipients must join the sandbox before alerts can be delivered.
