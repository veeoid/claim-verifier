# Claim Verifier

AI-assisted damage claim verification. A user submits a claim (an object type, a
description, and photos); a vision-language model inspects the photos, a
deterministic rule layer turns that perception into a verdict, and the result is
stored and surfaced on a dashboard.

The system is three services:

| Service | Path | Stack | Job |
|---|---|---|---|
| **Frontend** | [`frontend/`](frontend) | Next.js 16 (App Router), React 19, Tailwind v4 | Auth UI, claim submission, dashboard |
| **API** | [`api/`](api) | ASP.NET Core 10, EF Core, PostgreSQL | Auth, claim CRUD, persists analysis results |
| **Pipeline** | [`pipeline/`](pipeline) | FastAPI, Gemini / Groq VLM | Looks at the photos, decides the claim status |

## How a claim gets verified

```
Browser  ──HTTP──▶  Next.js (:3000)  ──HTTP + cookie──▶  ASP.NET Core API (:5076)
                                                                │        │
                                                          PostgreSQL   HTTP
                                                         (claims, users) │
                                                                         ▼
                                                          FastAPI pipeline (:8000)
                                                                         │
                                                                 Gemini / Groq VLM
```

1. The API saves the claim immediately (status `pending`) so it exists even if
   analysis fails.
2. It POSTs the claim text and base64 images to the pipeline's `/analyze`.
3. The pipeline's **vision** stage asks a VLM what it actually sees per image
   (object type, part, issue, severity, quality defects) — it does not decide
   anything.
4. The pipeline's **decide** stage applies deterministic rules over that
   perception (image usability, cross-image identity, object/part match,
   instruction-injection defense, claim history) to produce a final status.
5. The API writes the result back onto the same claim row.

Full detail on the rule engine, the evaluation harness, and the dataset format
lives in [`pipeline/code/README.md`](pipeline/code/README.md).

### Claim status values

| Status | Meaning |
|---|---|
| `pending` | Just submitted; analysis in progress |
| `supported` | Photo evidence backs the claim |
| `contradicted` | The claimed part is clearly visible and undamaged |
| `not_enough_information` | Evidence is insufficient to decide either way |
| `analysis_failed` | The pipeline call errored or timed out — a system failure, not a verdict |

## Repo layout

```
claim_verifier/
├── frontend/                Next.js app (App Router)
│   └── app/
│       ├── dashboard/       Overview, claim submission, claim detail
│       ├── login/ signup/   Auth pages
│       └── lib/             API client + status mapping
├── api/ClaimVerifier.Api/   ASP.NET Core Web API
│   ├── Controllers/         AuthController, ClaimsController
│   ├── Services/            AuthService, ClaimService, ClaimAnalysisService (pipeline client)
│   ├── Models/              Entities (User, Claim, ClaimImage) + DTOs
│   └── Migrations/          EF Core migrations (PostgreSQL)
└── pipeline/
    ├── service.py           FastAPI wrapper the API calls (/analyze)
    └── code/                vision.py, decide.py, schema.py — the rule engine
                              (see pipeline/code/README.md)
```

## Prerequisites

- Node.js 20+
- .NET 10 SDK
- Python 3.9+
- PostgreSQL (running locally, or any reachable instance)
- A Gemini and/or Groq API key (for the pipeline's VLM calls)

## Setup

### 1. Pipeline (FastAPI)

```bash
cd pipeline
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn google-genai groq python-dotenv pillow
```

Create `pipeline/code/.env`:

```
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

Run it:

```bash
# from pipeline/
PIPELINE_MODE=gemini uvicorn service:app --reload --port 8000
```

`PIPELINE_MODE` is `mock | gemini | groq` (defaults to `groq`). `mock` skips the
VLM entirely and returns a canned "usable evidence" perception — good for
exercising the API/frontend without burning API calls.

### 2. API (ASP.NET Core)

Add local secrets in `api/ClaimVerifier.Api/appsettings.Development.json`
(gitignored):

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=claimverifier;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "a-long-random-development-only-secret"
  },
  "ClaimAnalysis": {
    "BaseUrl": "http://localhost:8000"
  }
}
```

Then:

```bash
cd api/ClaimVerifier.Api
dotnet tool install --global dotnet-ef   # skip if already installed
dotnet ef database update                # applies the migrations in Migrations/
dotnet run
```

The API listens on `http://localhost:5076` (see `Properties/launchSettings.json`
for the HTTPS profile). CORS is locked to `http://localhost:3000`.

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). It talks to the API at
`NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5076`) — set that env var
if the API runs elsewhere.

## API surface

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Sets an HttpOnly `token` cookie |
| POST | `/api/auth/logout` | — | Clears the cookie |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/claims` | ✓ | Submit a claim (multipart: description, claimObject, photos[]) |
| GET | `/api/claims` | ✓ | List the current user's claims |
| GET | `/api/claims/{id}` | ✓ | Get one claim |

Auth is a JWT in an HttpOnly cookie (`SameSite=Lax`, not `Secure` in dev). Swagger
UI is available at `/swagger` when the API runs in Development.

## Data model

- **User** — email, hashed password
- **Claim** — description, claim object (`car | laptop | package`), status, and
  the pipeline's verdict fields (`EvidenceStandardMet`, `RiskFlags`, `IssueType`,
  `ObjectPart`, `Severity`, justification)
- **ClaimImage** — one row per uploaded photo, plus whether the pipeline marked
  it as supporting evidence
