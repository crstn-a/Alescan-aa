# ALESCAN — Automated Livestock & Essential Commodity Scanner

> A Progressive Web App (PWA) for real-time SRP (Suggested Retail Price) verification of basic commodities in Olongapo City, powered by YOLOv11 computer vision and sourced from the Department of Agriculture's Bantay Presyo price monitoring data.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation Guide](#installation-guide)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [User Role Guide](#user-role-guide)
   - [Consumer (Public User)](#consumer-public-user)
   - [Administrator](#administrator)
9. [Deployment](#deployment)

---

## Project Overview

ALESCAN is a city-level public service tool designed to help ordinary consumers — including elderly Filipinos and low-digital-literacy users — verify whether market prices for basic commodities (pork, chicken, tilapia) are within the official government-set SRP. Users point their phone camera at a commodity, and the system instantly identifies the item and displays its official price ceiling.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19, Vite, Vanilla CSS, PWA (vite-plugin-pwa) |
| Backend   | Python 3.11, FastAPI, Uvicorn                   |
| AI/Vision | YOLOv11 (Ultralytics), ONNX Runtime Web         |
| Database  | Supabase (PostgreSQL)                           |
| Auth      | JWT (python-jose), bcrypt                       |
| Scheduler | APScheduler (CronTrigger)                       |
| PDF Parse | LlamaParse (LlamaIndex Cloud)                   |
| Deploy    | Vercel (Frontend) · Railway (Backend via Docker)|

---

## Project Structure

```
Alescan-aa/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── middleware.py            # Admin JWT auth middleware
│   ├── scheduler.py             # Weekly price sync scheduler
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Docker container definition
│   ├── routers/
│   │   ├── scan.py              # POST /scan — commodity inference
│   │   ├── prices.py            # GET /prices — SRP lookup
│   │   └── admin.py             # Admin API (stats, logs, sync, analytics)
│   ├── services/
│   │   ├── vision.py            # YOLOv11 inference engine
│   │   ├── sync.py              # PDF fetch → extract → normalize → upsert
│   │   ├── extractor_llamaparse.py  # LlamaParse PDF extraction
│   │   ├── normalizer.py        # Row normalization & slug mapping
│   │   ├── pdf_fetcher.py       # DA Bantay Presyo PDF downloader
│   │   ├── analytics.py         # Analytics data aggregation
│   │   ├── auth.py              # Password hashing & JWT management
│   │   └── db.py                # Supabase client & DB helpers
│   └── weights/
│       └── best.pt              # Trained YOLOv11 model weights
└── frontend/
    ├── index.html
    ├── manifest.json            # PWA manifest
    ├── vite.config.js           # Vite + PWA configuration
    ├── package.json
    └── src/
        ├── App.jsx              # Root router
        ├── pages/
        │   ├── LandingPage.jsx  # Public home page
        │   ├── Scanner.jsx      # Camera + YOLO inference UI
        │   ├── Result.jsx       # Scan result display
        │   ├── AdminLogin.jsx   # Admin login page
        │   └── AdminDashboard.jsx # Admin control panel
        ├── api/                 # Axios API service helpers
        ├── hooks/               # Custom React hooks
        ├── layouts/             # Shared layout components
        └── utils/               # Utility functions
```

---

## Prerequisites

Ensure the following are installed on your machine before proceeding:

| Requirement       | Version    | Notes                                      |
|-------------------|------------|--------------------------------------------|
| Python            | 3.11+      | Required for the backend                   |
| Node.js           | 18+        | Required for the frontend                  |
| npm               | 9+         | Comes bundled with Node.js                 |
| Git               | Any        | For cloning the repository                 |
| pip               | Latest     | Python package manager                     |

---

## Installation Guide

### Backend Setup

#### 1. Navigate to the backend directory

```bash
cd Alescan-aa/backend
```

#### 2. Create and activate a Python virtual environment

```bash
# Create venv
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Windows CMD)
venv\Scripts\activate.bat

# Activate (macOS/Linux)
source venv/bin/activate
```

#### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ **Note:** The `requirements.txt` includes heavy ML packages (`torch`, `ultralytics`, `opencv-python`). Installation may take several minutes and requires ~3–5 GB of disk space.

#### 4. Add the YOLOv11 model weights

Download the trained model file (`best.pt`) and place it in:

```
backend/weights/best.pt
```

> The model file can be obtained from the project maintainer or via the `MODEL_URL` in `.env`.

#### 5. Configure environment variables

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) section below for required keys).

---

### Frontend Setup

#### 1. Navigate to the frontend directory

```bash
cd Alescan-aa/frontend
```

#### 2. Install Node.js dependencies

```bash
npm install
```

#### 3. Configure environment variables

Create a `.env` file in the `frontend/` directory with the required keys (see [Environment Variables](#environment-variables) section).

---

## Environment Variables

### Backend — `backend/.env`

| Variable            | Description                                           | Example / Default                              |
|---------------------|-------------------------------------------------------|------------------------------------------------|
| `SUPABASE_URL`      | Your Supabase project URL                             | `https://xxxx.supabase.co`                     |
| `SUPABASE_KEY`      | Supabase **service_role** key (not anon key)          | `eyJhbGci...`                                  |
| `LLAMACLOUD_API_KEY`| LlamaCloud API key for LlamaParse PDF extraction      | `llx-...`                                      |
| `JWT_SECRET`        | Secret key used to sign admin JWT tokens              | `your-strong-random-secret`                    |
| `FRONTEND_URL`      | Allowed CORS origin (your frontend URL)               | `https://alescan.vercel.app`                   |
| `MODEL_URL`         | Google Drive link to download `best.pt` model weights | `https://drive.google.com/file/d/...`          |

> ⚠️ **Security:** Never commit your `.env` file to version control. It is already listed in `.gitignore`.

### Frontend — `frontend/.env`

| Variable            | Description                           | Example                                      |
|---------------------|---------------------------------------|----------------------------------------------|
| `VITE_API_URL`      | Backend API base URL                  | `https://alescan.up.railway.app`             |
| `VITE_SUPABASE_URL` | Supabase project URL (for client SDK) | `https://xxxx.supabase.co`                   |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** (public) key   | `eyJhbGci...`                                |

---

## Running the Application

### Start the Backend (Development)

```bash
cd backend

# Activate virtual environment first
.\venv\Scripts\Activate.ps1   # Windows

# Run FastAPI with hot-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at: `http://localhost:8000`

Interactive API docs (Swagger UI): `http://localhost:8000/docs`

Health check: `http://localhost:8000/health`

### Start the Frontend (Development)

```bash
cd frontend
npm run dev
```

The PWA will be accessible at: `http://localhost:5173`

### Run Both Together

Open two separate terminals — one for each service — and run both commands above simultaneously.

---

## User Role Guide

ALESCAN defines two distinct user roles. There is no public registration; the system is intentionally designed for guided, single-purpose consumer use and secure administrator management.

---

### Consumer (Public User)

**Who:** General public, market shoppers, elderly consumers, barangay residents.

**Access:** No login required. Fully anonymous and public.

**Capabilities:**

| Action                        | Description                                                                 |
|-------------------------------|-----------------------------------------------------------------------------|
| **View Landing Page**         | Access the public home page with instructions and SRP information           |
| **Open Camera Scanner**       | Launch the live camera view to scan a commodity                             |
| **Scan a Commodity**          | Point the camera at pork liempo, whole chicken, or tilapia and tap Scan     |
| **View Scan Results**         | See the product name, official SRP (₱/kg), confidence score, and data week  |
| **Use Offline (PWA)**         | Install the app on a phone for offline access; price cache is stored locally |

**Consumer Flow:**

```
Landing Page → Open Scanner → Point Camera → Tap Scan → View Result
```

**Limitations:**
- Cannot access the Admin Dashboard or any `/admin/*` routes.
- Cannot add, edit, or delete any price or product data.
- Scans with confidence below 50% will show a "Not Recognized" prompt — no data is saved.

---

### Administrator

**Who:** Authorized personnel managing price data and system oversight (e.g., City Agriculture Office staff, IT admin).

**Access:** Login required via `/admin/login` using a username and bcrypt-hashed password stored in the `admin_users` Supabase table.

**Authentication:** Upon successful login, a JWT token (valid for 8 hours) is issued. All subsequent admin API calls must include this token as a `Bearer` header.

**Capabilities:**

| Action                            | Description                                                                                  |
|-----------------------------------|----------------------------------------------------------------------------------------------|
| **Log In / Log Out**              | Authenticate via the Admin Login page at `/admin/login`                                      |
| **View Dashboard Overview**       | See total scans, product count, active prices, error count, and last sync status             |
| **Trigger Manual Price Sync**     | Manually initiate the DA Bantay Presyo PDF fetch → extract → normalize → upsert pipeline     |
| **Monitor Automated Sync**        | Scheduled sync runs every **Monday at 8:00 AM Philippine Time (PHT)** automatically         |
| **View Scan Logs**                | Browse the last 200 scan events including product, confidence score, and timestamp           |
| **View Sync Logs**                | Review sync history including extractor used, status, and notes                             |
| **View Error Logs**               | Inspect system-level errors from any backend module                                         |
| **View Analytics — Prices**       | Interactive line chart of weekly SRP trends per commodity                                    |
| **View Analytics — Scans**        | Daily scan volume, detection confidence split, and per-commodity performance                 |
| **View Analytics — AI Evaluation**| Model and extractor benchmark results (accuracy, F1, precision, recall)                      |

**Admin Flow:**

```
/admin/login → Enter credentials → JWT issued → /admin Dashboard
```

**Admin Route Protection:**
- All `/admin/api/*` endpoints (except `/admin/api/login`) require a valid JWT `Bearer` token.
- Tokens are validated server-side by `AdminAuthMiddleware` on every protected request.
- Tokens expire after **8 hours** and must be re-authenticated.

**Supported Commodities (Current Model):**

| Class ID | Slug            | Display Name       |
|----------|-----------------|--------------------|
| 0        | `pork_liempo`   | Pork Belly Liempo  |
| 1        | `tilapia_local` | Tilapia (Local)    |
| 2        | `whole_chicken` | Whole Chicken      |

---

## Deployment

### Backend — Railway (Docker)

The backend is containerized via `backend/Dockerfile`. Deploy to Railway by connecting your GitHub repository and pointing it to the `backend/` directory. Railway auto-detects the Dockerfile.

Key production settings:
- Port: `8000` (defined in the `CMD` directive)
- Set all required environment variables via Railway's Variables panel.

### Frontend — Vercel

The frontend is deployed to Vercel. Connect the repository, set the **root directory** to `frontend/`, and Vercel will auto-detect the Vite configuration.

Set all `VITE_*` environment variables via Vercel's Environment Variables settings.

Live production URL: **https://alescan.vercel.app**

---

*Last updated: May 2026 | Alescan — Olongapo City Agriculture Office*
