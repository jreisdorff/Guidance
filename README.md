# Divinity 🌅

A quiet, private space to set down what you're feeling and be reminded of the
worth that was always yours.

Type honestly about whatever is on your mind. Divinity reads your words for the
feeling underneath — comparison, self-doubt, fear, feeling stuck, exhaustion,
setbacks, loneliness, or reaching for something greater — and offers back an
affirmation matched to it.

## Two ways to generate affirmations

Toggle between them any time in the app:

- **✨ AI affirmations** — each entry is sent to **Claude** (`claude-opus-4-8`),
  which writes a fresh, deeply personal affirmation responding to your exact
  words. Requires an Anthropic API key (see below). Your key stays on the local
  backend and never reaches the browser.
- **🌿 Offline** — the built-in "smart local engine" runs entirely in your
  browser. It reads your entry for emotional themes and responds with a matching
  affirmation. No key, no network, fully private. This is also the automatic
  fallback whenever the AI is unavailable.

## Run it

```bash
npm install
```

### With AI affirmations (recommended)

1. Copy `.env.example` to `.env` and paste your Anthropic API key
   (get one at https://console.anthropic.com/ → Settings → API Keys):

   ```bash
   cp .env.example .env
   # then edit .env and set ANTHROPIC_API_KEY=sk-ant-...
   ```
   

2. Start both the web app and the backend together:

   ```bash
   npm run dev
   ```

3. Open the URL it prints (usually http://localhost:5173).

### Offline only (no key needed)

```bash
npm run web
```

Everything still works — the app uses the local engine.

## Privacy

- **Offline mode** runs fully in your browser. Nothing you type leaves your
  device.
- **AI mode** sends what you type to Anthropic so Claude can compose the
  affirmation. Your API key lives only in `.env` on the backend
  (`server/index.js`) — it is never exposed to the browser. The app tells you,
  in the footer, when AI mode is active.
- Your journal of past entries is always saved in `localStorage` on this device
  only. Delete any entry, or clear the whole thing, at any time.

## How it works

- `server/index.js` — the backend. Holds your API key, calls Claude with
  structured outputs (guaranteed valid JSON), and returns the affirmation.
  Falls back to a 503 (which triggers the local engine) when no key is set.
- `src/affirmations.js` — the offline engine. Each emotional theme has weighted
  keywords and a pool of affirmations; your entry is scored against every theme.
  Edit this file to add your own affirmations or themes.
- `src/ai.js` — the tiny frontend client for the backend.
- `src/App.jsx` — the interface (React + Tailwind v4).

## Deploy to Vercel

The app is built for Vercel out of the box: the Vite frontend deploys as a
static site, and `api/affirm.js` + `api/health.js` deploy as serverless
functions (the local `server/index.js` is only used for `npm run dev`; both
share `lib/claude.js`).

1. Push this project to a GitHub repository.
2. At https://vercel.com → **Add New → Project**, import that repo. Vercel
   auto-detects Vite — no build settings to change.
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your `sk-ant-...` key
4. Deploy. The frontend and `/api/*` functions are served from the same domain,
   so no extra configuration is needed.

> ⚠️ **Protect your deployment.** A public URL means anyone who finds it could
> use your endpoint and spend your Anthropic credits. For a personal app, turn
> on **Settings → Deployment Protection → Vercel Authentication** (free on
> Hobby) so only your Vercel account can open it. You can also cap spend in the
> Anthropic console under Settings → Billing.

To change the key later, update the env var in Vercel and redeploy.

## Build a static version (offline only)

`npm run build` produces a static `dist/` folder for the frontend. Served on its
own without the functions, it runs in offline mode (the local engine).

---

Made as a gentle daily practice. You are deserving of the things you have set
out for.
