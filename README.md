# IPAL Monitoring Client (Frontend)

Frontend dashboard for an **IPAL (wastewater treatment) monitoring** system. Built with **React + Vite**, it connects to the backend API to show sensor/water-quality data, dashboards, alerts, reporting, and notifications.

- Backend repo: https://github.com/ProfDian/IPAL-Monitoring-Server
- Live URL (seen in backend CORS allow-list): https://ipal-monitoring-teklingundip.vercel.app

> Note: this repository is a fork (origin: `RahadianAW/prototypeWaterQual`) and has been customized for the IPAL monitoring use case.

## Features
- Auth flow (token stored in `localStorage`)
- Dashboard views (charts)
- Map visualization (Leaflet)
- Data fetching layer with a shared API wrapper
- Firebase integration (client SDK) for related features (e.g. messaging/notifications)

## Tech stack
- React 19 + Vite
- TailwindCSS
- React Router
- TanStack React Query
- Recharts
- Leaflet / React Leaflet
- Firebase (client SDK)

## Configuration
Create a `.env` file in the project root:
```bash
# Backend API base URL (defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000

# Firebase (see src/config/firebase.js)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Portfolio notes (what this project demonstrates)
- Modern React app structure with a single API layer (`src/services/api.js`)
- Handling auth sessions on the client (token attach + 401 flows)
- Data visualization and map-based UI
