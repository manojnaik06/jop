# MERN Assessment Backend

Backend scaffold for the MERN assessment. Includes:

- `POST /sync` to fetch and persist private dataset
- `GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`
- `GET /tasks/search?q=...` and filter query params
- `GET /stats` for analytics
- `GET /health` for DB health check

## Run locally

1. Install dependencies

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill values

3. Start server

```bash
npm run dev
```
