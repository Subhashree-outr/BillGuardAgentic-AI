# BillGuard Agentic AI

BillGuard is a full-stack bill and subscription auditing application. It accepts billing documents and transaction data, detects suspicious or wasteful spending, estimates possible savings, and prepares actions that remain behind a human approval gate.

The project is an agentic prototype: deterministic TypeScript tools provide financial facts, a supervisor can choose which read-only tool to call next, SQLite stores the run state, and Gemini is optional intelligence for document extraction, planning, analysis, and chat.

## Product Goal

Help a user reduce unnecessary recurring expenses without affecting essential services.

Typical findings include:

- Duplicate charges
- Dormant or forgotten subscriptions
- Sudden subscription price increases
- Redundant services such as overlapping music or cloud storage plans
- Unusual spending spikes
- Upcoming renewals
- AWS cloud-cost anomalies in the synthetic demo data

BillGuard creates recommendations such as dispute a charge, cancel a subscription, downgrade a plan, or set a budget cap. It does not automatically cancel services, request refunds, or move money.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Motion, Lucide React |
| Main backend | Node.js, Express, TypeScript, `tsx` |
| Database | Local SQLite through Node `node:sqlite` |
| AI | Google Gemini through `@google/genai` |
| Uploads | Multer memory storage, PDF text extraction with `pdf-parse` |
| Realtime activity | Server-Sent Events (SSE) |
| Optional backend | FastAPI, SQLAlchemy, SQLite under `/backend` |

## Setup

### Prerequisites

- Node.js 22 or newer is recommended because the project uses Node's native SQLite API.
- npm
- A Gemini API key is optional for deterministic text parsing, but required for Gemini chat and image-bill extraction.

### Install

```bash
npm install
```

### Environment

Create `.env` in the repository root. Never commit this file.

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

The server also accepts the legacy variable name `GEMINI_AI_KEY`, but `GEMINI_API_KEY` is preferred.

`GEMINI_MODEL` is optional. The default is `gemini-2.5-flash-lite`, chosen to reduce request and token usage. Use a model available to the Google AI project associated with the key.

### Changing Gemini on or off

The active Node server reloads `.env` on each API request. You can change the Gemini setting while the development server is running:

| `.env` state | `/api/health` | Behavior |
| --- | --- | --- |
| `GEMINI_API_KEY` or `GEMINI_AI_KEY` contains a key | `hasGeminiKey: true` | Gemini chat, AI analysis, and image extraction are attempted |
| Key is removed or left empty | `hasGeminiKey: false` | Deterministic text parsing remains available; chat and image extraction are unavailable |

After editing `.env`, save the file and refresh the browser. No server restart is required in development. Check `http://localhost:3000/api/health` to confirm the current state. A production deployment should still be restarted or redeployed when its process environment changes.

### Start development mode

```bash
npm run dev
```

Open `http://localhost:3000`.

Check startup configuration at `http://localhost:3000/api/health`:

```json
{
  "status": "ok",
  "hasGeminiKey": true,
  "model": "gemini-2.5-flash-lite",
  "database": "sqlite3"
}
```

`hasGeminiKey: true` only confirms that an environment variable exists. A Gemini request can still fail if the key is invalid, restricted, expired, or over quota.

### Production build

```bash
npm run build
npm run start
```

The build creates the Vite frontend and bundles the Express server into `dist/server.cjs`.

### Render Web Service deployment

Render can host the full BillGuard application as a Web Service. This is the recommended free demo deployment when you need both the React frontend and the Express backend APIs online.

Create a new **Web Service** on Render and connect this repository. Use these settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |

Add these environment variables in Render:

```env
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

No `VITE_API_URL` or frontend API base URL change is needed. The Express server already serves the built React app from `dist/` and exposes the backend routes under the same origin, such as `/api/health`, `/api/analyze`, `/api/chat`, `/api/bills/upload`, and `/api/agent/stream/:id`.

After deployment, open the Render service URL and check:

```text
https://your-render-service.onrender.com/api/health
```

Expected response includes `status: "ok"`, `database: "sqlite3"`, and `hasGeminiKey: true` if the key is configured.

Free Render limitations:

- The service sleeps after inactivity.
- The first request after sleep can be slow.
- Local SQLite data may be lost on redeploy or restart.
- This setup is suitable for a demo or hackathon, not production financial data.
- For production use, add persistent storage, authentication, rate limiting, secret management, and a real managed database.

### GitHub Pages deployment

GitHub Pages serves static files only. The repository includes `.github/workflows/deploy-pages.yml`, which runs `npm ci`, builds only the Vite frontend, and deploys `dist/` whenever `main` changes. Vite automatically uses `/<repository-name>/` as the Pages base path, so the browser loads built assets instead of requesting `/src/main.tsx`.

For this repository, the project Pages URL is:

`https://subhashree-outr.github.io/BillGuardAgentic-AI/`

Do not open `https://subhashree-outr.github.io/` unless the separate `Subhashree-outr.github.io` repository is configured to deploy this project. The root user-site URL is a different GitHub Pages site.

Enable **Settings > Pages > Source: GitHub Actions** in the repository. The static Pages deployment cannot run Express routes such as `/api/chat`, `/api/analyze`, uploads, SQLite, the watcher, or agent execution. Use `npm run dev` or a Node deployment for those backend features.

### User-provided Gemini keys

The Settings tab supports a session-only Bring Your Own Key flow when running against the Node backend:

- The key is held in React memory only; it is not written to `localStorage`, SQLite, GitHub, analytics, or logs.
- Requests send it only in the `X-Gemini-API-Key` header to the configured backend.
- The Remove Key control clears it from the browser session.
- GitHub Pages disables key entry because a static public site cannot protect a browser-visible credential.
- Users should revoke keys from Google AI Studio if they suspect exposure.

This is not a claim that a browser-held key is invisible to its owner or browser extensions. It prevents BillGuard from storing the key by default.

For production, set `NODE_ENV=production` and optionally configure `PORT`:

```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

The server adds basic security headers, disables Express fingerprinting, limits request timeouts, returns generic internal errors, and closes the watcher/database during `SIGINT` or `SIGTERM` shutdown. Put TLS termination, authentication, rate limiting, secret management, and process supervision in the deployment platform or reverse proxy for a real public deployment.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express and Vite middleware in development mode |
| `npm run build` | Build the frontend and bundled backend |
| `npm run start` | Run the production bundle |
| `npm run preview` | Preview the Vite frontend build |
| `npm run lint` | Run TypeScript with `--noEmit` |
| `npm run test` | Run the TypeScript workflow/tool test suite |
| `npm run clean` | Remove generated distribution output |

## Startup Process

The main entrypoint is `server.ts`.

1. `dotenv` loads `.env` before the first Gemini request.
2. SQLite is initialized from `server/db.ts`.
3. Missing tables are created.
4. If no user exists, the synthetic demo user and financial dataset are seeded.
5. Express is configured for JSON, URL-encoded requests, and 10 MB in-memory file uploads.
6. The Gemini client is created or removed dynamically when requests reload `GEMINI_API_KEY` or `GEMINI_AI_KEY`.
7. REST API routes are registered.
8. The `/api/chat` route receives the initialized Gemini client.
9. In development, Vite middleware is attached. In production, `dist` is served.
10. The autonomous watcher starts automatically.
11. Express listens on `0.0.0.0:3000`.

### Watcher behavior

The watcher starts every time the Node server starts. It runs a local simulated check every 30 seconds and keeps the last 20 log messages in memory.

It currently reads local bill records and logs whether statements exist. It does **not** connect to banks, vendor APIs, email, AWS, Netflix, Uber, or other external financial systems.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/watcher/status` | Read watcher state and logs |
| `POST /api/watcher/start` | Start the watcher if stopped |
| `POST /api/watcher/stop` | Stop the watcher |
| `POST /api/watcher/events` | Submit a simulated financial event and trigger an approval-gated agent run |

Supported event types are `NEW_TRANSACTION`, `NEW_BILL`, `PRICE_CHANGE`, `RENEWAL_APPROACHING`, `SPENDING_SPIKE`, and `USER_CONSTRAINT_CHANGED`. This is a local event simulator for demonstrations; it is not a bank or vendor webhook integration.

## User Features

| Feature | Where to use it | Gemini required? | What it does |
| --- | --- | --- | --- |
| Dashboard audit | Dashboard tab | No | Analyze pasted, CSV, JSON, or text transaction data |
| Demo datasets | Dashboard tab | No | Load prepared synthetic billing scenarios |
| Bill upload | Dashboard or Bills tab | Text/PDF text: no; images: yes | Parse bill documents into SQLite bill and line-item records |
| Drag and drop | Dashboard or Bills tab | Same as bill upload | Drop supported files or use the file picker |
| Paste/edit statement | Dashboard or Bills tab | No | Submit raw bill or transaction text to the deterministic parser |
| Goal Mode | Goal Mode tab | Optional | Run the stateful supervisor and specialist workflow |
| Agent activity | Agent Activity tab | Optional | View persisted agent events and tool calls |
| Bills and invoices | Bills tab | Optional | Browse uploaded bills and upload additional documents |
| Transactions | Transactions tab | No | Browse the local transaction ledger |
| Subscriptions | Subscriptions tab | No | Browse active, dormant, and overlapping subscriptions |
| Demo scenarios | Hackathon Demos tab | Optional | Run five predefined agent, fallback, and replanning demonstrations |
| Decision traces | Finding/action views | Optional | Inspect evidence, confidence, reasoning, and proposed actions |
| Human approval | Action plan/modal | No | Approve or reject consequential proposed actions |
| Chat | Chat panel | Yes | Ask Gemini about the latest audit state |
| FX conversion | FX alert/tool UI | No | Convert currencies using a live endpoint or static fallback rates |
| JSON report | JSON tab | No | Inspect the structured dashboard report |

## Upload Behavior

Supported file types include PDF, PNG, JPG/JPEG, TXT, and CSV depending on the upload surface.

### With Gemini

- Text PDFs are parsed locally and may be sent to Gemini for structured extraction.
- Images are sent to Gemini Vision for extraction.
- Merchant, dates, totals, taxes, currency, categories, and line items are stored in SQLite.

### Without Gemini

- Text, CSV, JSON, and text-based PDF content can be parsed deterministically.
- The parser uses values present in the uploaded content and does not invent a default bill total.
- A bill must contain a recognizable total such as `Total Amount: 25.00` or `Amount Due: 25.00`.
- Image uploads are rejected because local code cannot perform OCR without Gemini.

## Agents

The workflow coordinator is `server/agents/index.ts`. Each agent has its own module, while shared event and type contracts live in `server/agents/events.ts` and `server/agents/contracts.ts`.

| Agent | Main responsibility | Main tools or state |
| --- | --- | --- |
| Supervisor Agent | Select the next missing read-only investigation based on observations and tool history | Tool registry, optional Gemini selection, reasoning trace |
| Bill Analyzer Agent | Inspect uploaded bills and record bill observations | `bill_parser_tool`, SQLite bills |
| Anomaly Detection Agent | Find duplicate charges, price hikes, and unusual AWS spikes | Transaction, subscription, and historical tools |
| Subscription Agent | Find dormant and redundant subscriptions | `subscription_detection_tool` |
| Investigation Agent | Verify merchant terms and cancellation/dispute paths | `merchant_verification_tool`, fallback strategy |
| Action Agent | Create prioritized proposed actions and approval checkpoints | `savings_calculator_tool`, SQLite actions |
| Evaluation Agent | Compare projected savings with the user's target | `savings_calculator_tool`, evaluation state |
| Replanning Agent | Expand or change the plan when the target is missed or a constraint changes | `budget_analysis_tool`, action state |

### Agent module layout

| File | Ownership |
| --- | --- |
| `server/agents/index.ts` | Thin workflow coordinator and state lifecycle |
| `server/agents/supervisor.ts` | Goal-directed tool selection and bounded ReAct loop |
| `server/agents/registry.ts` | Read-only investigation capability registry |
| `server/agents/billAnalyzerAgent.ts` | Bill observations |
| `server/agents/anomalyAgent.ts` | Duplicate, price, and spending anomaly findings |
| `server/agents/subscriptionAgent.ts` | Dormancy and overlapping subscription findings |
| `server/agents/investigationAgent.ts` | Merchant verification and fallback recovery |
| `server/agents/actionAgent.ts` | Constraint-aware approval-required action proposals |
| `server/agents/simulation.ts` | Risk, service-impact, reversibility, and candidate-plan simulation |
| `server/agents/evaluationAgent.ts` | Goal/savings evaluation |
| `server/agents/replanningAgent.ts` | Additional opportunity search and plan expansion |

The run state stores the goal, constraints, observations, reasoning trace, selected tools, tool history, findings, evidence, actions, errors, fallback actions, savings evaluation, replanning status, and final outcome.

## Tools

### Supervisor registry tools

These are read-only capabilities that the Supervisor Agent can select dynamically.

| Registry tool | Risk | What it does |
| --- | --- | --- |
| `inspect_bills` | Read-only | Reads uploaded bills and summarizes merchants, totals, recurrence, and line items |
| `find_duplicate_charges` | Read-only | Compares merchant and amount pairs within a 24-hour window |
| `find_subscription_anomalies` | Read-only | Finds dormant subscriptions, price increases, and overlapping service groups |
| `analyze_discretionary_budget` | Read-only | Estimates possible savings from non-essential recurring services |

### Full backend tool set

| Tool | What it does | External dependency |
| --- | --- | --- |
| `bill_parser_tool` | Extracts merchant, dates, total, tax, currency, category, recurrence, and line items | Gemini optional; deterministic text fallback |
| `transaction_analysis_tool` | Detects duplicate transactions and builds category spending totals | Local SQLite |
| `subscription_detection_tool` | Detects dormant subscriptions, price increases, and duplicate service groups | Local SQLite |
| `historical_comparison_tool` | Compares current price with stored previous price | Local SQLite |
| `merchant_verification_tool` | Returns cancellation/dispute metadata | Local catalog; failure can be simulated |
| `currency_conversion_tool` | Converts currencies | Live exchangerate-api.com with static fallback |
| `savings_calculator_tool` | Calculates monthly and annual savings | Deterministic local calculation |
| `budget_analysis_tool` | Finds discretionary subscriptions and estimates savings | Local SQLite |
| `setMerchantVerificationForceFail` | Enables/disables simulated verification failure | In-memory demo flag |

Gemini may interpret documents or select investigation tools, but it is not trusted to calculate savings or authorize actions.

### Implemented planning features

- Constraint-aware action filtering, including work-related service protection.
- Low-confidence work-related findings can create a pending `ASK_USER` question instead of an automatic cancellation proposal.
- Candidate Conservative, Balanced, and Maximum Savings plans are generated and scored by projected savings and risk.
- Every proposed action includes a simulation with monthly savings, annual savings, service impact, reversibility, and risk.
- Tool failures are recorded in the run state and the supervisor continues with fallback selection.

To answer a pending agent question:

```text
POST /api/agent/:run_id/questions/:questionId/answer
{ "answer": "Keep it" }
```

## Agent Workflow

```text
User goal and constraints
        |
        v
Supervisor selects missing evidence
        |
        v
Read-only registry tool executes
        |
        v
State, reasoning trace, and event are persisted
        |
        v
Specialist agents detect and investigate issues
        |
        v
Action Agent creates approval-required proposals
        |
        v
Evaluation compares savings with target
        |
        +--> Target missed or constraint changed: replan
        |
        v
Outcome waits for human approval
```

The supervisor loop is bounded to six iterations. Invalid Gemini output, unknown tools, repeated tools, or Gemini unavailability trigger deterministic selection. Tool failures are recorded and the workflow continues where possible.

## Human Approval and Safety

Consequential actions are created with `requires_approval: true`, `approval_status: pending`, and `execution_status: pending`.

The approval API records the user's decision. A cancellation currently changes the local synthetic subscription to `cancelling`; it does not contact the real merchant.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/actions/:id/approve` | Approve a proposed action |
| `POST /api/actions/:id/reject` | Reject a proposed action with an optional reason |

## Main API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Health, database, model, and key-presence status |
| `POST /api/auth/register` | Mock local registration |
| `POST /api/auth/login` | Mock local login |
| `GET /api/bills` | List bills |
| `POST /api/bills/upload` | Upload and extract a bill |
| `GET /api/transactions` | List transactions |
| `GET /api/subscriptions` | List subscriptions |
| `GET /api/agent/goals` | List goals |
| `POST /api/agent/goals` | Create a goal |
| `POST /api/agent/goals/:id/run` | Run the agent workflow |
| `GET /api/agent/:run_id/status` | Read a persisted run |
| `GET /api/agent/:run_id/events` | Read persisted events |
| `GET /api/agent/stream/:id` | Stream workflow events through SSE |
| `GET /api/analytics/summary` | Read financial summary |
| `GET /api/analytics/savings` | Read savings estimate and breakdown |
| `POST /api/demo/run-scenario` | Run demo scenario 1 through 5 |
| `POST /api/demo/reset-synthetic` | Reset the synthetic dataset |
| `POST /api/chat` | Ask Gemini about the latest audit |
| `POST /api/tools/fx` | Convert currencies |

## Demo Scenarios

| Scenario | Demonstrates |
| --- | --- |
| 1 | Detect unnecessary subscriptions |
| 2 | Detect suspicious price increases |
| 3 | Merchant verification failure and fallback investigation |
| 4 | User constraint change and replanning |
| 5 | Savings target miss followed by an expanded plan |

## Data and Persistence

The active Node application stores data in `billguard.db` in the repository root. It contains users, bills, bill items, transactions, subscriptions, goals, agent runs, events, actions, approvals, anomalies, and financial insights.

The repository also contains an optional Python FastAPI implementation under `/backend`. It uses SQLAlchemy and `billguard_python.db`, but the normal `npm run dev` flow uses the Node/Express backend and `billguard.db`.

## Repository Cleanup Policy

The active application is the Node/Express server in `server.ts` plus the React frontend in `src/`. The optional `/backend` implementation is retained for reference or a future Python deployment. `dist/`, `node_modules/`, local `.db` files, and `.env.*` files are generated or machine-specific and are ignored by Git. npm's `package-lock.json` is retained for reproducible installs; Bun's unused `bun.lock` was removed.

## Current Limitations

- Authentication and tokens are mock local-development behavior.
- The default dataset is synthetic.
- Normal API operations use the default demo user.
- Merchant verification is local/simulated.
- Approved actions do not execute real cancellations, refunds, or bank disputes.
- The watcher is a local timer simulation, not live monitoring.
- Chat requires a valid Gemini key and available quota.
- Gemini errors fall back to deterministic analysis where possible.
- No live bank, inbox, subscription-provider, or AWS billing integration is included.
- The optional Python backend is not used by the main React application.

## Tests

```bash
npm test
npm run lint
```

If TypeScript reports missing React or JSX declarations, run `npm install` again. The required `@types/react` and `@types/react-dom` packages are development dependencies and must be installed before `npm run lint` or `npm run build`.

The test suite covers bill parsing, duplicate detection, dormant subscriptions, historical price changes, simulated tool failure, savings calculations, human approval, supervisor registry execution, and end-to-end replanning.
