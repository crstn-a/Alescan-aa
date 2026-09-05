# ALESCAN: Palengke SRP Scanner

> A Progressive Web App (PWA) for real-time SRP (Suggested Retail Price) verification of basic commodities in Olongapo City Public Market, powered by **YOLOv26** custom-trained computer vision and sourced directly from the Department of Agriculture (DA) official price monitoring Google Sheet.

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

ALESCAN is a city-level public service tool designed to help ordinary consumers verify whether market prices for basic commodities (such as pork, chicken, fish, vegetables, rice, and spices) adhere to official government-set SRP standards. 

Users point their smartphone camera at a commodity, and the system instantly identifies the item using a custom-trained **YOLOv26** object detection model with 54 commodity classes. The app resolves commodity specifications and displays the latest prevailing market prices synced directly from the Department of Agriculture's official price monitoring spreadsheet.

---

## Tech Stack

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| **Frontend**   | React 19, Vite, Vanilla CSS, PWA (`vite-plugin-pwa`)           |
| **Backend**    | Python 3.11, FastAPI, Uvicorn                                  |
| **AI / Vision**| **YOLOv26** (Custom-Trained Object Detection, 54 Classes)       |
| **Data Source**| **DA Google Sheet** (Service Account OAuth2 / CSV Stream API) |
| **Database**   | Supabase (PostgreSQL)                                          |
| **Auth**       | JWT (`python-jose`), `bcrypt`                                  |
| **Scheduler**  | APScheduler (`CronTrigger`)                                    |
| **Deploy**     | Vercel (Frontend) · Railway (Backend via Docker)               |

---

## Project Structure

```
Alescan-aa/
├── backend/
│   ├── main.py                  # FastAPI app entry point & startup warmup
│   ├── middleware.py            # Admin JWT auth middleware
│   ├── scheduler.py             # Daily DA Google Sheet sync scheduler (08:00 AM PHT)
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Production Docker container definition
│   ├── service_account.json     # Optional Google Service Account credentials
│   ├── train_model.py           # YOLOv26 model training script
│   ├── test_yolov26.py          # Sanity check for YOLOv26 model & class mapping
│   ├── test_sheet_sync.py       # Sanity check for Google Sheet CSV parsing
│   ├── model/
│   │   ├── data.yaml            # Roboflow dataset config (54 commodity classes)
│   │   ├── best.pt              # Trained YOLOv26 model weights
│   │   ├── train/               # Training images & labels
│   │   ├── valid/               # Validation images & labels
│   │   └── test/                # Test images & labels
│   ├── routers/
│   │   ├── scan.py              # POST /scan — YOLOv26 commodity inference
│   │   ├── prices.py            # GET /prices — SRP lookup & active commodity lists
│   │   └── admin.py             # Admin API (stats, logs, manual sync, analytics)
│   └── services/
│       ├── vision.py            # YOLOv26 model loader & inference engine
│       ├── sync.py              # Google Sheet fetch → parse → database upsert pipeline
│       ├── sheet_fetcher.py     # DA Google Sheet client (Direct CSV, OAuth2, API key)
│       ├── analytics.py         # Analytics data aggregation
│       ├── auth.py              # Password hashing & JWT token management
│       └── db.py                # Supabase client & database helpers
└── frontend/
    ├── index.html
    ├── manifest.json            # PWA manifest
    ├── vite.config.js           # Vite + PWA configuration
    ├── package.json
    └── src/
        ├── App.jsx              # Root application router
        ├── pages/
        │   ├── LandingPage.jsx  # Public home page
        │   ├── Scanner.jsx      # Camera view & live scanner interface
        │   ├── Result.jsx       # Scan result display with price breakdown
        │   ├── AdminLogin.jsx   # Admin authentication page
        │   └── AdminDashboard.jsx # Admin control panel
        ├── api/                 # Axios API service helpers
        ├── hooks/               # Custom React hooks
        ├── layouts/             # Shared layout components
        └── utils/               # Utility & formatting functions
```

---

## Prerequisites

Ensure the following are installed on your machine before proceeding:

| Requirement | Version | Notes                      |
| ----------- | ------- | -------------------------- |
| **Python**  | 3.11+   | Required for backend execution |
| **Node.js** | 18+     | Required for frontend tooling |
| **npm**     | 9+      | Bundled with Node.js       |
| **Git**     | Any     | For repository management  |

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

#### 4. Configure environment variables

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) section below).

> 💡 **YOLOv26 Model Weights:** The trained model weights (`best.pt`) must be placed in `backend/model/best.pt`. To train a new model from the Roboflow dataset, run `python train_model.py` from the backend directory.

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

| Variable                       | Description                                                     | Example / Default                                    |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------- |
| `SUPABASE_URL`                 | Your Supabase project URL                                       | `https://xxxx.supabase.co`                           |
| `SUPABASE_KEY`                 | Supabase **service_role** key                                   | `eyJhbGci...`                                        |
| `GOOGLE_SHEET_ID`              | DA Bantay Presyo Google Spreadsheet ID                          | `1QW1KwKXEPSPIKqTss0aD56O6knQTFvbK4hjdP5fqdZI`       |
| `GOOGLE_SHEETS_CSV_URL`        | Direct CSV export URL for the Google Sheet                      | `https://docs.google.com/spreadsheets/d/.../gid=0`  |
| `GOOGLE_SERVICE_ACCOUNT_FILE`  | Path to Google Service Account JSON file                        | `service_account.json`                               |
| `GOOGLE_SERVICE_ACCOUNT_JSON`  | Inline JSON payload for Google Service Account                  | `{"type": "service_account", ...}`                   |
| `GOOGLE_SHEETS_API_KEY`        | Optional Google Sheets API v4 key fallback                      | `AIzaSy...`                                          |
| `JWT_SECRET`                   | Secret key used to sign admin JWT tokens                        | `your-strong-random-secret`                          |
| `FRONTEND_URL`                 | Allowed CORS origin (your frontend deployment URL)             | `https://alescan.vercel.app`                         |

### Frontend — `frontend/.env`

| Variable                 | Description                           | Example                          |
| ------------------------ | ------------------------------------- | -------------------------------- |
| `VITE_API_URL`           | Backend API base URL                  | `https://alescan.up.railway.app` |
| `VITE_SUPABASE_URL`      | Supabase project URL (for client SDK) | `https://xxxx.supabase.co`       |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** (public) key        | `eyJhbGci...`                    |

---

## Running the Application

### Start the Backend (Development)

```bash
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1   # Windows

# Run FastAPI with live reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be accessible at: `http://localhost:8000`
- Interactive API Docs (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Start the Frontend (Development)

```bash
cd frontend
npm run dev
```

The application will be accessible at: `http://localhost:5173`

---

## User Role Guide

### Consumer (Public User)

**Who:** General public, market shoppers, and local consumers.

**Access:** Public access — no account registration or login required.

**Capabilities:**

| Action                  | Description                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **View Landing Page**   | Access general info and instructions on SRP verification                                           |
| **Open Camera Scanner** | Launch live camera stream for scanning market commodities                                         |
| **Scan Commodity**      | Capture food items (pork, chicken, fish, vegetables, rice, etc.) for instant AI-powered detection |
| **View SRP Results**    | Inspect prevailing price, price ranges (low/high), average price, unit, and detection confidence |
| **Use Offline (PWA)**   | Install app on mobile devices for offline access and cached SRP viewing                           |

**Consumer Flow:**
```
Landing Page ──> Open Scanner ──> Capture Commodity Image ──> YOLOv26 Detection ──> SRP Result Page
```

---

### Administrator

**Who:** Authorized personnel managing official price synchronization and market monitoring.

**Access:** Secured via `/admin/login` using credentials verified against the `admin_users` database table.

**Capabilities:**

| Action                             | Description                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **Log In / Log Out**               | Authenticate via the Admin Login page                                                    |
| **View Overview Dashboard**        | Monitor total scans, active products, sync status, and system error rates                |
| **Manual Price Sync**              | Trigger immediate fetch, parse, and upsert pipeline from the DA Google Sheet             |
| **Automated Monthly Sync**         | Automated cron schedule syncing official prices from DA Google Sheet                     |
| **View Scan & Sync Logs**          | Review real-time detection logs, raw sync logs, and system error tracebacks              |
| **Analytics & Reporting**          | Interactive charts for price trends, daily scan activity, and commodity performance      |
| **Manage Violations**              | Log and manage price ceiling violation reports from consumers                            |

**Supported Commodities (54 Classes — Custom-Trained YOLOv26 Model):**
- **Fish Products:** Alumahan Indian Mackerel, Bangus, Bonito Frigate Tuna, Galunggong Local, Salmon Head Imported, Sardines Tamban, Squid Pusit Bisaya Local, Tambakol Yellow Fin Tuna Local
- **Meat Products:** Beef Brisket Local, Beef Rump Local, Pork Belly Liempo Local, Pork Picnic Shoulder Kasim Local, Whole Chicken
- **Lowland Vegetables:** Ampalaya, Eggplant, Squash, Tomato, Chayote, Pole Sitao
- **Highland Vegetables:** Bell Pepper Green, Bell Pepper Red, Broccoli Local, Cabbage Scorpio, Carrots Local, Cauliflower Local, Celery, Lettuce Green Ice, Lettuce Iceberg, Lettuce Romaine, Pechay Baguio, White Potato Local, Habichuelas Baguio Beans
- **Spices:** Chili Green Local, Chili Red Local, Garlic Imported, Ginger Local, Red Onion Local, White Onion Local
- **Fruits:** Avocado, Banana Lakatan, Banana Latundan, Banana Saba, Calamansi, Mango Carabao, Melon, Papaya, Pomelo, Watermelon
- **Corn & Legumes:** Corn White, Corn Yellow, Mungbean
- **Other:** Sugar Brown, Sugar Refined, Sugar Wash

---

## Deployment

### Backend — Railway (Docker)

1. Deploy the `backend/` folder to Railway using the provided `Dockerfile`.
2. Ensure environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, `GOOGLE_SHEET_ID`, `JWT_SECRET`, `FRONTEND_URL`, etc.) are configured in Railway.
3. Place the trained `model/best.pt` weights in the deployed container.

### Frontend — Vercel

1. Connect the GitHub repository to Vercel and set root directory to `frontend/`.
2. Configure environment variables (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Production URL: **https://alescan.vercel.app**