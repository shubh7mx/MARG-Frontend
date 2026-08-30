# MARG by Shubham

**Maritime Analysis & Route Generation** — optimal wind-aware ship routing for the Indian Ocean region.

https://ma-rg.pages.dev

Frontend: React + Vite + Tailwind, Leaflet map, Tauri desktop shell.
Backend: Flask route engine (Isochrone A*) — see `../Main`.

## Run (development)

```bash
npm install
npm run dev        # UI on http://localhost:1420
```

The UI calls the route engine at `VITE_API_URL` (defaults to `http://127.0.0.1:5000`, `POST /map`).

## Build

```bash
npm run build      # web build → dist/
npm run tauri dev  # optional desktop shell
```

## Deploy (free hosting)

- **Frontend**: Cloudflare Pages / Netlify / Vercel — build `npm run build`, output `dist/`.
- **Backend**: Render.com free web service — start command `python main.py` (binds `0.0.0.0:$PORT`).
- Point the frontend at the backend with `VITE_API_URL=https://<your-backend>.onrender.com`.
