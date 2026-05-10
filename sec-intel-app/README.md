# SEC Intel App

Monorepo for a full-stack SEC filing intelligence dashboard that turns recent EDGAR filings into source-linked capital-markets signals for a U.S. stock ticker.

## Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Node.js, Fastify, TypeScript
- Database: PostgreSQL with Prisma migration files and `pg` runtime queries
- Optional AI extraction: OpenAI, guarded behind `OPENAI_API_KEY`

## Monorepo layout

```text
sec-intel-app/
  apps/
    backend/
    frontend/
  packages/
    shared/
```

## What it does

For a user-provided ticker like `AAPL`, `TSLA`, or `NVDA`, the app:

1. Validates and normalizes the ticker.
2. Resolves the ticker to the official SEC CIK.
3. Fetches recent company submissions from EDGAR.
4. Builds filing archive URLs deterministically from CIK, accession number, and primary document.
5. Detects capital-markets events from filing text:
   - Buybacks / repurchase programs
   - Public offerings
   - Shelf registrations
   - ATM programs
   - Registered direct offerings
   - Convertible debt / note offerings
   - Warrants
   - Dilution / financing language
6. Returns source-linked structured events with confidence and filing snippets.

If no relevant event is found, the app returns `Not found in recent filings.`

## API

### `GET /api/company/:ticker`

Returns company metadata:

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "companyName": "Apple Inc.",
  "sic": "3571",
  "fiscalYearEnd": "0927"
}
```

### `GET /api/filings/:ticker?limit=20&forms=8-K,10-Q`

Returns recent filings and SEC archive links.

### `POST /api/analyze`

Request:

```json
{
  "ticker": "AAPL",
  "limit": 20
}
```

Response:

```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "cik": "0000320193",
  "analyzedAt": "2026-05-10T08:00:00.000Z",
  "events": [],
  "recentFilings": []
}
```

## Environment variables

### Backend

Copy [apps/backend/.env.example](/Users/szy/Documents/GitHub/secreader/sec-intel-app/apps/backend/.env.example) to `.env`.

- `DATABASE_URL`
- `SEC_USER_AGENT`
- `OPENAI_API_KEY` optional
- `OPENAI_MODEL` optional
- `CORS_ORIGIN`
- `PORT`

### Frontend

Copy [apps/frontend/.env.example](/Users/szy/Documents/GitHub/secreader/sec-intel-app/apps/frontend/.env.example) to `.env.local`.

- `NEXT_PUBLIC_API_BASE_URL`

## Local setup

```bash
npm install
```

Create a PostgreSQL database, then apply the migration:

```bash
cd apps/backend
npx prisma migrate deploy
```

From the monorepo root you can run:

```bash
npm run dev:backend
npm run dev:frontend
```

Useful backend commands:

```bash
npm run seed:tickers --workspace @sec-intel-app/backend
npm run test --workspace @sec-intel-app/backend
```

## Database schema

Primary tables:

- `companies`
- `filings`
- `filing_events`

Additional cache table:

- `filing_documents`

`filing_documents` stores normalized filing text so the backend does not repeatedly download the same filing body.

## Caching and rate limiting

- In-memory TTL cache for ticker resolution and recent filing lists
- PostgreSQL-backed cache for companies, filings, filing text, and extracted filing events
- Fastify API rate limiting on incoming requests
- SEC fetch scheduler with a delay between outbound SEC requests
- SEC requests include the configured `SEC_USER_AGENT`
- Outbound SEC fetches use request timeouts

## Event detection approach

The first pass is deterministic and source-grounded:

- Keyword detection per filing
- Snippet extraction around matched phrases
- Heuristic parsing for amount, security type, and status
- Strict `NONE_FOUND` fallback when no capital-markets event is identified

When `OPENAI_API_KEY` is present:

- The backend sends only matched filing snippets to the model
- The model is asked for strict JSON only
- Missing values must remain `not found`
- If the model call fails, the backend falls back to rule-based output

## Frontend experience

- Landing page with hero, explanation, and ticker search
- Dynamic ticker route at `/ticker/[ticker]`
- Event cards with:
  - event type
  - summary
  - amount
  - filing date
  - filing form
  - confidence
  - source snippet
  - SEC link
- Event-type filter
- Refresh action
- Filing table
- Mobile and desktop layouts

## Tests included

Backend tests cover:

- ticker validation
- CIK formatting
- SEC archive URL construction
- deterministic event detection

Run them with:

```bash
npm test
```

## Railway deployment notes

Recommended setup:

1. Create a Railway project with a PostgreSQL service.
2. Set the service root to the monorepo root: `sec-intel-app`.
3. Set environment variables from the backend example.
4. Use these commands:
   - Install: `npm install`
   - Build: `npm run build`
   - Start: `npm run start --workspace @sec-intel-app/backend`
5. Run database migrations as part of deployment or a Railway pre-deploy step:
   - `npm run db:migrate --workspace @sec-intel-app/backend`

The backend listens on `process.env.PORT`, which is required by Railway.

## Vercel deployment notes

Recommended setup:

1. Import the same repository into Vercel.
2. Set the project root directory to `apps/frontend`.
3. Add `NEXT_PUBLIC_API_BASE_URL` pointing to the Railway backend URL.
4. Redeploy after the backend URL is live.

The frontend only calls the backend through `NEXT_PUBLIC_API_BASE_URL`; no backend secrets are exposed to the browser.

## Verification

Verified locally in this workspace:

- `npm test`
- `npm run lint`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 npm run build`
