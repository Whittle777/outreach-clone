# Frontend (React)

This folder contains a small React UI to interact with the backend API. It is configured to use Vite.

Quick start:

```bash
cd frontend
npm install
npm run dev
```

Notes:
- The UI expects the backend at `http://localhost:3000` and a WebSocket server at `ws://localhost:8080`.
- API client: `src/services/api.js`.
- Pages: `Dashboard`, `Prospects`, `Sequences`, `Sequence Steps`, `WebSocket viewer`.
