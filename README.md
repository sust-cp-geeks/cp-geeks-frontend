# SUST CPGeeks — Frontend

Competitive programming community platform for SUST students — announcements, contests, practice archives, Codeforces stats, and VJudge contest ranking.

**Stack:** React 19 · Vite · React Router 7

## Quick Start

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev            # http://localhost:3000
```

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start dev server with HMR          |
| `npm run build`   | Production build → `dist/`         |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run ESLint                         |

## Configuration

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `VITE_API_URL` | Backend API base URL (defaults to `http://localhost:8080`) |

## Deployment

Any static host works. On Vercel, set `VITE_API_URL` in the project's environment variables — SPA routing is handled by `vercel.json`.
