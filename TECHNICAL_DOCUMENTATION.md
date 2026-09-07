# ALESCAN — Technical Documentation

> **Version:** 1.0  
> **Last Updated:** September 2026  
> **Project:** Palengke SRP Scanner — Olongapo City Public Market  
> **Production URL:** https://alescan.vercel.app  
> **Backend API:** https://alescan.up.railway.app

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Backend — API Reference](#6-backend--api-reference)
   - [Scan Endpoint](#61-scan-endpoint)
   - [Prices Endpoints](#62-prices-endpoints)
   - [Admin Endpoints](#63-admin-endpoints)
   - [Report / User Endpoints](#64-report--user-endpoints)
7. [AI / Vision Pipeline](#7-ai--vision-pipeline)
8. [Price Data Sync Pipeline](#8-price-data-sync-pipeline)
9. [Authentication & Security](#9-authentication--security)
10. [Frontend Application](#10-frontend-application)
11. [Scheduler](#11-scheduler)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [Development Setup](#14-development-setup)
15. [Data Flow Diagrams](#15-data-flow-diagrams)

---

## 1. System Overview

**ALESCAN** is a Progressive Web App (PWA) built as a public civic service tool for Olongapo City, Philippines. Its core purpose is to help ordinary market consumers instantly verify whether prices offered by market vendors comply with the Department of Agriculture (DA) Suggested Retail Price (SRP) standards.

### Core Capabilities

| Capability | Description |
|---|---|
| **AI Commodity Detection** | Camera scan → YOLOv26 inference → commodity identification (54 classes) |
| **SRP Price Lookup** | Detected commodity → latest prevailing market price retrieval |
| **Price Data Sync** | Automated and manual pull from DA Bantay Presyo Google Sheet |
| **Violation Reporting** | Consumer-submitted reports of price violations with photo evidence |
| **Admin Dashboard** | Real-time monitoring of scans, prices, sync logs, analytics, and vendor reports |
| **PWA Support** | Installable on mobile devices, offline-capable for cached SRP viewing |

### User Roles

| Role | Access | Auth Method |
|---|---|---|
| **Consumer (Public)** | Landing page, scanner, result, report vendor | Optional user account (JWT) |
| **Administrator** | Full admin dashboard, sync controls, analytics | Admin JWT token (8h expiry) |

---

## 2. Architecture

### High-Level Architecture

```
+------------------------------------------------------------------+
|                      CLIENT (Browser/PWA)                        |
|                 React 19 + Vite + Workbox SW                     |
|  +------------+  +----------+  +----------+  +---------------+  |
|  | LandingPage|  | Scanner  |  |  Result  |  | AdminDashboard|  |
|  +------------+  +-----+----+  +-----+----+  +-------+-------+  |
+-------------------------|--------------|-----------------|---------+
                          |  HTTPS/REST  |                 |
+-------------------------v--------------v-----------------v---------+
|                  BACKEND (FastAPI / Uvicorn)                       |
|                   Railway - Docker Container                       |
|  +--------------+  +------------+  +---------+  +------------+   |
|  |  /scan POST  |  | /prices/*  |  |/admin/* |  |/api/reports|   |
|  +------+-------+  +-----+------+  +----+----+  +-----+------+   |
|         |                |              |              |           |
|  +------v-------+        |        +-----v------+      |           |
|  |  vision.py   |        |        |  sync.py   |      |           |
|  | (YOLOv26     |        |        |(Sheet->DB  |      |           |
|  |  Inference)  |        |        | pipeline)  |      |           |
|  +------+-------+        |        +-----+------+      |           |
+---------|----------------|--------------|--------------|------------+
          |                |              |              |
+---------v----------------v--------------v--------------v-----------+
|                    Supabase (PostgreSQL)                            |
|  products | price_records | scan_events | sync_logs | violations   |
|  admin_users | public_users | vendor_reports | error_logs          |
+--------------------------------------------------------------------+
          ^
          | CSV / OAuth2 / API Key
+---------+------------------+
|  DA Bantay Presyo          |
|  Google Sheet              |
|  (Official SRP Data Source)|
+----------------------------+
```

### Middleware Stack (Execution Order)

FastAPI middleware is registered in reverse execution order:

```
Incoming Request
       |
       v
+---------------------+
|   CORSMiddleware    |  <- Registered first, executes LAST
|  (wraps everything) |     Handles OPTIONS preflight
+----------+----------+
           |
           v
+---------------------+
| AdminAuthMiddleware |  <- Registered second, executes FIRST
|  (JWT gate for      |     Blocks /admin/* without valid Bearer token
|   /admin/api/*)     |     Passes through /admin/api/login and /api/reports
+----------+----------+
           |
           v
       FastAPI Router (scan / prices / admin / reports)
```

---

## 3. Tech Stack & Dependencies

### Backend

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.136.1 | ASGI web framework, API routing |
| `uvicorn` | 0.46.0 | ASGI server |
| `ultralytics` | 8.4.46 | YOLOv26 model loading and inference |
| `torch` | 2.11.0 | PyTorch deep learning runtime |
| `torchvision` | 0.26.0 | Image transformation utilities |
| `pillow` | 12.2.0 | Image decoding (JPEG/PNG to RGB) |
| `supabase` | 2.29.0 | Supabase PostgreSQL client |
| `python-jose` | 3.5.0 | JWT encoding/decoding (admin & user tokens) |
| `bcrypt` | 5.0.0 | Password hashing (cost factor 12) |
| `APScheduler` | 3.11.2 | Background cron job for daily price sync |
| `requests` | 2.33.1 | HTTP client for Google Sheet CSV fetch |
| `PyJWT` | 2.12.1 | Google Service Account JWT signing (RSA256) |
| `python-dotenv` | 1.2.2 | `.env` environment variable loading |
| `pydantic` | 2.13.3 | Request/response model validation |
| `opencv-python-headless` | 4.9.0.80 | Image processing (headless, for Docker) |
| `PyYAML` | 6.0.3 | Parsing `data.yaml` for YOLO class names |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.2.4 | UI framework |
| `react-dom` | 19.2.4 | DOM rendering |
| `react-router-dom` | 7.14.1 | Client-side routing |
| `axios` | 1.15.0 | HTTP client for API calls |
| `recharts` | 3.8.1 | Analytics charts (price trends, scan volume) |
| `@supabase/supabase-js` | 2.103.1 | Direct Supabase client (frontend storage) |
| `vite` | 7.3.2 | Build tool and dev server |
| `vite-plugin-pwa` | 1.2.0 | Service Worker, Workbox, PWA manifest injection |
| `onnxruntime-web` | 1.26.0 | ONNX runtime for potential client-side inference |

---

## 4. Project Structure

```
Alescan-aa/
|-- TECHNICAL_DOCUMENTATION.md   <- This file
|-- README.md                    <- User-facing quick-start guide
|-- TermsAndConditions.md        <- App terms of service
|-- yolo11s.pt                   <- YOLOv26 base weights (pre-training)
|
|-- backend/
|   |-- main.py                  <- FastAPI app entry; registers routers, middleware, startup hooks
|   |-- middleware.py             <- AdminAuthMiddleware (JWT guard for /admin/api/*)
|   |-- scheduler.py             <- APScheduler: daily price sync cron at 08:00 AM PHT
|   |-- requirements.txt         <- Pinned Python dependencies (132 packages)
|   |-- Dockerfile               <- Production Docker image (python:3.11-slim + system libs)
|   |-- service_account.json     <- Google Service Account credentials (gitignored in prod)
|   |-- train_model.py           <- YOLOv26 training script (YOLO26s -> fine-tune on 54-class dataset)
|   |-- test_sheet_sync.py       <- Sanity test: fetch & parse Google Sheet CSV
|   |-- test_yolov26.py          <- Sanity test: load model, run dummy inference, check class mapping
|   |-- yolo26s.pt               <- Pre-trained YOLO26s base weights
|   |
|   |-- model/
|   |   |-- best.pt              <- Trained weights (54-class commodity model) - REQUIRED at runtime
|   |   |-- data.yaml            <- Roboflow dataset config: 54 commodity class names
|   |   |-- train/               <- Training images + YOLO label .txt files
|   |   |-- valid/               <- Validation images + labels
|   |   +-- test/                <- Test images + labels
|   |
|   |-- routers/
|   |   |-- scan.py              <- POST /scan - image upload -> YOLOv26 inference -> SRP response
|   |   |-- prices.py            <- GET /prices, GET /prices/{id} - price lookup endpoints
|   |   |-- admin.py             <- /admin/api/* - all admin dashboard endpoints
|   |   +-- reports.py           <- /api/reports/* - user registration, login, report submission
|   |
|   |-- services/
|   |   |-- vision.py            <- YOLOv26 model loader, inference engine, confidence rating
|   |   |-- sync.py              <- Price sync pipeline: fetch -> parse -> upsert
|   |   |-- sheet_fetcher.py     <- Google Sheet CSV client (3-strategy auth fallback)
|   |   |-- analytics.py         <- Analytics aggregation: prices, scans, evaluations, daily volume
|   |   |-- auth.py              <- Admin auth: bcrypt verify, JWT create/decode (type="admin")
|   |   |-- user_auth.py         <- User auth: register, bcrypt verify, JWT create/decode (type="user")
|   |   +-- db.py                <- Supabase singleton; get_latest_price, log_scan_event, log_error
|   |
|   +-- migrations/
|       |-- migration_sheet_prices.sql   <- Adds price range columns to price_records; creates indexes
|       +-- migration_vendor_reports.sql <- Creates public_users and vendor_reports tables
|
+-- frontend/
    |-- index.html               <- HTML shell with <div id="root">
    |-- manifest.json            <- PWA manifest (name, icons, theme_color, display: standalone)
    |-- vite.config.js           <- Vite + vite-plugin-pwa config; Workbox caching rules; dev proxy
    |-- package.json             <- Node dependencies and build scripts
    |-- vercel.json              <- Vercel deployment config (SPA rewrite rules)
    |
    +-- src/
        |-- main.jsx             <- React entry; mounts <App />
        |-- App.jsx              <- Root router: 8 routes across consumer and admin flows
        |-- App.css              <- Global styles
        |-- index.css            <- CSS reset and base tokens
        |
        |-- pages/
        |   |-- LandingPage.jsx  <- Public home: hero, features, SRP list, tutorial trigger
        |   |-- Scanner.jsx      <- Live camera capture; sends image to POST /scan
        |   |-- Result.jsx       <- Displays scan result: commodity, prices, confidence badge
        |   |-- AdminLogin.jsx   <- Admin credential form -> POST /admin/api/login
        |   |-- AdminDashboard.jsx <- Full admin control panel (see Section 10)
        |   |-- UserSignup.jsx   <- Consumer registration form
        |   |-- UserLogin.jsx    <- Consumer login form
        |   +-- ReportVendor.jsx <- Vendor price violation report submission form
        |
        |-- components/
        |   |-- AnalyticsReportModal.jsx <- PDF analytics report generation modal (with date filters)
        |   |-- SyncDetailsModal.jsx     <- Sync log detail: per-commodity price changes
        |   |-- TutorialModal.jsx        <- Step-by-step scanner tutorial overlay
        |   +-- TermsModal.jsx           <- Terms and Conditions modal
        |
        |-- api/
        |   |-- config.js        <- Exports API base URL from VITE_API_URL env var
        |   |-- scanApi.js       <- Axios wrapper for POST /scan
        |   |-- adminApi.js      <- Axios wrappers for all /admin/api/* endpoints
        |   +-- reportApi.js     <- Axios wrappers for /api/reports/* endpoints
        |
        |-- hooks/
        |   |-- useCamera.js     <- MediaDevices API hook: camera stream management
        |   |-- useAdminAuth.js  <- Admin JWT state: localStorage persist, logout
        |   +-- useUserAuth.js   <- User JWT state: localStorage persist, logout
        |
        |-- layouts/             <- Shared layout wrappers
        +-- utils/               <- Formatting helpers (price, date, etc.)
```

---

## 5. Database Schema

All tables reside in Supabase (PostgreSQL). The Supabase client authenticates using the service role key (`SUPABASE_KEY`).

### `products`

Represents a unique commodity tracked in the system. Created or updated during each price sync.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | Auto-incrementing primary key |
| `name` | `TEXT` | Canonical commodity name (e.g., `"Bangus"`) |
| `display_name` | `TEXT` | Human-readable name shown in UI |
| `slug` | `TEXT UNIQUE` | URL-safe, lowercase identifier (e.g., `"bangus"`) |
| `category` | `TEXT` | Commodity group (e.g., `"Fish Products"`) |
| `commodity_name` | `TEXT` | Alias/denormalized name from sheet |

**Lookup strategy in `db.py`:** Exact slug match → Exact name match → Word-level Jaccard fuzzy match (threshold >= 0.5).

---

### `price_records`

Stores one price record per product per sync day (`week_of` date acts as the dedup key).

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `product_id` | `BIGINT FK -> products.id` | |
| `commodity_name` | `TEXT` | Denormalized name for display |
| `category` | `TEXT` | Commodity category |
| `specification` | `TEXT` | e.g., `"Local"`, `"Imported"` |
| `unit` | `TEXT DEFAULT 'kg'` | Unit of measure |
| `price_per_kg` | `NUMERIC(10,2)` | Base price field (legacy compat) |
| `price_prevailing` | `NUMERIC(10,2)` | Current market prevailing price |
| `price_low` | `NUMERIC(10,2)` | Lowest observed price |
| `price_high` | `NUMERIC(10,2)` | Highest observed price |
| `price_average` | `NUMERIC(10,2)` | Average market price |
| `period_month` | `TEXT` | Month from DA sheet header (e.g., `"September"`) |
| `period_year` | `INTEGER` | Year from DA sheet header |
| `source` | `TEXT` | Always `"DA Bantay Presyo (Sheet Sync)"` |
| `week_of` | `DATE` | Sync date; used as dedup key with `product_id` |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

**Indexes:** `idx_price_records_commodity(commodity_name)`, `idx_price_records_period(period_year, period_month)`

---

### `scan_events`

Logs every commodity scan attempt, regardless of confidence outcome.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `product_id` | `BIGINT FK -> products.id` | `NULL` if unidentified |
| `confidence` | `FLOAT` | Raw YOLOv26 confidence (0.0 - 1.0) |
| `price_shown` | `NUMERIC` | Price displayed to user at scan time |
| `scanned_at` | `TIMESTAMPTZ DEFAULT now()` | |
| `session_id` | `TEXT` | Optional session grouping identifier |

---

### `sync_logs`

Records each price sync operation (manual or automated).

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `extractor_used` | `TEXT` | Always `"sheet"` |
| `status` | `TEXT` | `"success"` or `"failed"` |
| `pdf_url` | `TEXT` | Link to source Google Sheet |
| `notes` | `TEXT` | Success: record count. Failure: error message |
| `synced_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

### `error_logs`

Centralized error log written by `db.log_error()` from any module.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `module` | `TEXT` | Source module (`"sync"`, `"scan"`, `"admin"`, etc.) |
| `message` | `TEXT` | Full error message/traceback |
| `occurred_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

### `admin_users`

Stores administrator accounts. Passwords are bcrypt-hashed (cost 12).

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `username` | `TEXT UNIQUE` | Lowercased on lookup |
| `password_hash` | `TEXT` | bcrypt hash |

---

### `public_users`

Consumer user accounts for report submission.

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `first_name` | `TEXT NOT NULL` | |
| `last_name` | `TEXT NOT NULL` | |
| `email` | `TEXT UNIQUE NOT NULL` | Lowercased on registration |
| `password_hash` | `TEXT NOT NULL` | bcrypt hash (cost 12) |
| `phone` | `TEXT` | Optional |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

**Index:** `idx_public_users_email(email)`

---

### `vendor_reports`

Consumer-submitted price violation reports (Market Officer task tickets).

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | Ticket number: `RPT-{id:05d}` |
| `user_id` | `BIGINT FK -> public_users.id ON DELETE CASCADE` | |
| `vendor_name` | `TEXT NOT NULL` | Market stall/vendor name |
| `store_number` | `TEXT NOT NULL` | Stall number in the market |
| `commodity_name` | `TEXT NOT NULL` | Commodity with alleged violation |
| `price_seen` | `NUMERIC(10,2) NOT NULL` | Price the consumer saw |
| `complaint_description` | `TEXT NOT NULL` | Free-text complaint |
| `image_url` | `TEXT` | Photo evidence URL (Supabase Storage) |
| `status` | `TEXT DEFAULT 'pending'` | `pending` -> `reviewing` -> `resolved` / `dismissed` |
| `officer_notes` | `TEXT` | Market officer response notes |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ DEFAULT now()` | |

**Indexes:** `idx_vendor_reports_user_id`, `idx_vendor_reports_status`, `idx_vendor_reports_created_at DESC`

---

### `violations`

Admin-managed violation records (separate from consumer-submitted vendor reports).

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGSERIAL PK` | |
| `name` | `TEXT` | Violating party name |
| `store_number` | `TEXT` | |
| `complaint_description` | `TEXT` | |
| `image_url` | `TEXT` | Supabase Storage URL |
| `status` | `TEXT DEFAULT 'submitted'` | Admin-controlled lifecycle |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

---

### `model_evaluations` / `extractor_evaluations`

Stores historical model and extraction performance metrics for the Analytics Evaluations chart.

---

## 6. Backend — API Reference

Base URL: `https://alescan.up.railway.app`  
Interactive Docs: `https://alescan.up.railway.app/docs`

### 6.1 Scan Endpoint

#### `POST /scan`

Accepts a raw image file upload, runs YOLOv26 inference, and returns the detected commodity with its current SRP data.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `file` | Yes | JPEG/PNG photo of the commodity |

**Response `200 OK`:**

```json
{
  "product": "Bangus",
  "commodity_name": "Bangus",
  "category": "Fish Products",
  "specification": "Local",
  "unit": "kg",
  "confidence": 87.3,
  "confidence_level": "High",
  "price_prevailing": 185.00,
  "price_low": 160.00,
  "price_high": 200.00,
  "price_average": 180.00,
  "period_month": "September",
  "period_year": 2026,
  "source": "DA Bantay Presyo (Sheet Sync)"
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `400` | Image unreadable or decoding failed |
| `422` | Detection confidence < 40% (`low_confidence` error with confidence value) |
| `404` | Commodity detected but no price record exists in DB |
| `500` | Internal inference error |

**Processing Pipeline:**

```
Image Upload -> Decode (Pillow) -> YOLOv26 Inference -> Confidence Gate (>=40%)
    -> Price Lookup (db.get_latest_price) -> Log Scan Event -> Return JSON
```

---

### 6.2 Prices Endpoints

#### `GET /prices/{identifier}`

Returns the latest SRP data for a specific commodity, resolved by name or slug.

**Path Parameter:** `identifier` — commodity name or slug (e.g., `"bangus"`, `"Pork Belly Liempo Local"`)

**Response `200 OK`:** Same structure as `/scan` response (minus confidence fields).

**Error:** `404` if no price record found.

---

#### `GET /prices`

Returns the latest SRP data for all active commodities in the system.

**Response `200 OK`:** Array of price objects (same structure as above).

---

### 6.3 Admin Endpoints

All `/admin/api/*` endpoints (except `/admin/api/login`) require a valid Bearer JWT token in the `Authorization` header.

#### `POST /admin/api/login`

**Request (JSON):**
```json
{ "username": "admin", "password": "secret" }
```

**Response `200 OK`:**
```json
{ "access_token": "<JWT>", "token_type": "bearer", "username": "admin" }
```

---

#### `GET /admin/api/stats`

Returns high-level dashboard counters.

```json
{
  "total_scans": 1432,
  "total_products": 54,
  "active_prices": 52,
  "total_errors": 3,
  "last_sync": {
    "id": 12,
    "extractor_used": "sheet",
    "status": "success",
    "synced_at": "2026-09-07T08:00:00Z",
    "notes": "Inserted 54 prices from DA Google Sheet"
  }
}
```

---

#### `GET /admin/api/stats/scans`

Filtered scan stats for the dashboard date-range filter.

| Query Param | Values | Description |
|---|---|---|
| `mode` | `all`, `daily`, `weekly`, `monthly` | Filter window |
| `date` | `YYYY-MM-DD` | Reference date (defaults to today) |

**Response:** `{ count, scans[], range, mode }`

---

#### `POST /admin/api/sync`

Manually triggers the full price sync pipeline (same as the scheduled sync).

**Response:** `{ "status": "triggered", "result": { "status": "success", "extractor": "sheet", "count": 54 } }`

---

#### `GET /admin/api/logs/scan`

Returns recent scan event logs.

| Query Param | Default | Max |
|---|---|---|
| `limit` | `50` | `200` |

---

#### `GET /admin/api/logs/sync`

Returns sync history with embedded **price change details** for each successful sync.

For each successful sync log entry, the response includes a `details` array:

```json
{
  "id": 12,
  "status": "success",
  "synced_at": "2026-09-07T08:00:00Z",
  "details": [
    {
      "product": "Bangus",
      "price_from": 170.00,
      "price_to": 185.00,
      "price_change": 15.00,
      "price_change_pct": 8.8,
      "prev_date": "2026-08-07"
    }
  ]
}
```

Price change lookup strategy:
1. Query `price_records` within +-15 minutes of `synced_at`
2. Fallback: query by `week_of = synced_at date`
3. Bulk fetch previous prices for all matched `product_id` values before that date

---

#### `GET /admin/api/logs/errors`

| Query Param | Default | Description |
|---|---|---|
| `limit` | `20` | Max 100 |
| `module` | (all) | Filter by module name |

---

#### `GET /admin/api/prices`

Returns all price records with full price range data (low/high/average/prevailing).

| Query Param | Default | Max |
|---|---|---|
| `limit` | `100` | `500` |

---

#### `GET /admin/api/analytics/prices`

Price trend time-series data for charting, grouped by commodity and week.

| Query Param | Description |
|---|---|
| `start_date` | `YYYY-MM-DD` filter start |
| `end_date` | `YYYY-MM-DD` filter end |

---

#### `GET /admin/api/analytics/scans`

Scan analytics including detection performance split, daily volume, and commodity performance breakdown.

| Query Param | Description |
|---|---|
| `start_date` | Filter start |
| `end_date` | Filter end |

**Response:**
```json
{
  "total_scans": 1432,
  "detection_split": [
    { "name": "High Confidence", "value": 72.1 },
    { "name": "Medium Confidence", "value": 18.4 },
    { "name": "Low Confidence / Failed", "value": 9.5 }
  ],
  "daily_volume": [{ "date": "2026-09-01", "scans": 34 }],
  "commodity_performance": [
    { "name": "Bangus", "total": 120, "Success": 98, "Medium Confidence": 15, "Low Confidence": 15, "Failed": 7 }
  ]
}
```

**Confidence thresholds:** High >= 0.70 | Medium Confidence 0.50–0.70 | Low Confidence / Failed < 0.50

---

#### `GET /admin/api/analytics/daily-volume`

Daily scan volume for a specific date range (fills zero-scan days).

| Query Param | Required |
|---|---|
| `start_date` | Yes |
| `end_date` | Yes |

---

#### `GET /admin/api/analytics/evaluations`

Returns model and extractor evaluation metrics from `model_evaluations` and `extractor_evaluations` tables.

---

#### Violations CRUD

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/api/violations` | Create violation (multipart: name, store_number, description, image?) |
| `GET` | `/admin/api/violations` | List violations (param: `limit`) |
| `PUT` | `/admin/api/violations/{id}` | Full update (multipart with optional new image) |
| `PATCH` | `/admin/api/violations/{id}/status` | Update status only (form: `status`) |

---

#### Vendor Reports (Admin View)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/api/reports` | List all vendor reports (params: `limit`, `status` filter) |
| `GET` | `/admin/api/reports/stats` | Report counts by status |
| `PATCH` | `/admin/api/reports/{id}/status` | Update status + officer_notes (form data) |

**Valid statuses:** `pending`, `reviewing`, `resolved`, `dismissed`

---

### 6.4 Report / User Endpoints

All under prefix `/api/reports`. No admin auth required; user endpoints use their own JWT (`type="user"`).

#### `POST /api/reports/register`

**Request (JSON):**
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "email": "juan@email.com",
  "password": "secret123",
  "phone": "09171234567"
}
```

**Response:** `{ access_token, token_type, user: { id, first_name, last_name, email } }`

**Error:** `409` if email already exists.

---

#### `POST /api/reports/login`

**Request (JSON):** `{ "email": "...", "password": "..." }`  
**Response:** Same structure as register.

---

#### `POST /api/reports/submit`

Requires `Authorization: Bearer <user_token>` header.

**Request:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `vendor_name` | string | Yes |
| `store_number` | string | Yes |
| `commodity_name` | string | Yes |
| `price_seen` | float | Yes |
| `complaint_description` | string | Yes |
| `image` | file | No (optional) |

**Response:** `{ status: "success", data: {...}, ticket_number: "RPT-00042" }`

Images are uploaded to the `violation-images` Supabase Storage bucket at path `reports/{uuid}.{ext}`.

---

#### `GET /api/reports/my-reports`

Requires user JWT. Returns the authenticated user's submitted reports (limit 50, most recent first).

---

## 7. AI / Vision Pipeline

### Model Architecture

- **Base Model:** YOLO26s (YOLOv26 small variant, ~20MB)
- **Fine-tuned on:** Alescan custom commodity dataset (Roboflow export)
- **Task:** Object Detection (single-class per image — highest confidence box wins)
- **Input:** 640x640 px RGB image
- **Output:** Bounding boxes with class ID and confidence scores
- **Classes:** 54 commodity categories
- **Confidence Threshold:** 0.40 (configurable in `vision.py:CONFIDENCE_THRESHOLD`)

### Commodity Classes (54 Total)

| Category | Commodities |
|---|---|
| **Fish Products** | Alumahan Indian Mackerel, Bangus, Bonito Frigate Tuna, Galunggong Local, Salmon Head Imported, Sardines Tamban, Squid Pusit Bisaya Local, Tambakol Yellow Fin Tuna Local |
| **Beef Products** | Beef Brisket Local, Beef Rump Local |
| **Pork Products** | Pork Belly Liempo Local, Pork Picnic Shoulder Kasim Local |
| **Poultry Products** | Whole Chicken |
| **Lowland Vegetables** | Ampalaya, Eggplant, Squash, Tomato, Chayote, Pole Sitao |
| **Highland Vegetables** | Bell Pepper Green/Red, Broccoli Local, Cabbage Scorpio, Carrots Local, Cauliflower Local, Celery, Lettuce (Green Ice/Iceberg/Romaine), Pechay Baguio, White Potato Local, Habichuelas Baguio Beans |
| **Spices** | Chili Green/Red Local, Garlic Imported, Ginger Local, Red/White Onion Local |
| **Fruits** | Avocado, Banana (Lakatan/Latundan/Saba), Calamansi, Mango Carabao, Melon, Papaya, Pomelo, Watermelon |
| **Corn & Legumes** | Corn White, Corn Yellow, Mungbean |
| **Rice** | Imported Commercial Rice, Local Commercial Rice |
| **Other** | Sugar Brown, Sugar Refined, Sugar Wash |

### Inference Flow

```python
# 1. Decode image
img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

# 2. Run detection
results = model(img, verbose=False)[0]

# 3. Select highest-confidence box
best_box = max(results.boxes, key=lambda b: b.conf.item())
class_id = int(best_box.cls.item())
confidence = float(best_box.conf.item())

# 4. Map class ID to name from data.yaml CLASS_NAMES list
detected_name = CLASS_NAMES[class_id]

# 5. Confidence tiering
if confidence >= 0.70:   level = "High"
elif confidence >= 0.50: level = "Medium"
else:                    level = "Low"

# 6. Price lookup (slug -> exact -> fuzzy Jaccard)
price_info = get_latest_price(detected_name)
```

### Model Startup Warmup

On application startup (`main.py @app.on_event("startup")`), `vision.warmup()` runs a dummy inference on a 640x640 gray image to:
- Pre-load the model into GPU/CPU memory
- Eliminate cold-start latency on the first real scan

### Model Training

Run from the `backend/` directory:

```bash
python train_model.py
```

Training configuration:

| Parameter | Value |
|---|---|
| Base model | `yolo26s.pt` |
| Epochs | 50 (with early stopping, `patience=10`) |
| Image size | 640px |
| Batch size | 16 |
| Output | `model/best.pt` (auto-copied after training) |
| Checkpoints | Every 10 epochs |

---

## 8. Price Data Sync Pipeline

### Data Source

**DA Bantay Presyo Google Sheet:**  
`https://docs.google.com/spreadsheets/d/1QW1KwKXEPSPIKqTss0aD56O6knQTFvbK4hjdP5fqdZI`

The sheet follows the Department of Agriculture Monthly Price Monitoring format with sections per commodity category and columns: COMMODITY, SPECIFICATION, UNIT, LOW, HIGH, AVERAGE, PREVAILING.

### Three-Strategy Fetch (`sheet_fetcher.fetch_sheet_csv`)

The fetcher tries three authentication strategies in order:

```
Strategy 1: Direct CSV Export URL
  GET {GOOGLE_SHEETS_CSV_URL or DEFAULT_SHEET_URL}
  Accept if: status=200 AND Content-Type contains "text/csv"
         OR response text starts with known header keywords
  | (on failure)

Strategy 2: Google Sheets API v4 with Service Account OAuth2
  1. Load service_account.json (from file or GOOGLE_SERVICE_ACCOUNT_JSON env)
  2. Sign JWT (RSA256, exp=1h, scope=spreadsheets.readonly + drive.readonly)
  3. Exchange JWT for Bearer token at token_uri
  4. GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/A1:Z300
  5. Convert rows[] to CSV via csv.writer
  | (on failure)

Strategy 3: Google Sheets API v4 with API Key
  GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/A1:Z300?key={GOOGLE_SHEETS_API_KEY}
  Convert rows[] to CSV
```

### CSV Parsing (`sheet_fetcher.parse_sheet_csv`)

The parser processes the DA Monthly Summary format:

1. **Month/Year extraction:** Scans first 10 rows for month name and 4-digit year
2. **Category detection:** Rows matching `KNOWN_CATEGORIES` (e.g., `"FISH PRODUCTS"`) set the current category context
3. **Header row detection:** Row containing `"COMMODITY"` or `"PREVAILING"` maps column indices
4. **Data row extraction:** Each subsequent non-empty row with a valid price is parsed:
   - `commodity_name` -> title-cased and whitespace-normalized
   - `specification`, `unit` (defaults to `"kg"`)
   - `price_low`, `price_high`, `price_average`, `price_prevailing`
   - Fallback chain: `prevailing = avg or high or low`
   - Price validation: `1.0 <= price <= 5000.0` (rejects header text, invalid values)

**Output:** List of normalized commodity dicts with category, prices, period, and source.

### Database Upsert (`sync._upsert_sheet_prices`)

For each parsed commodity record:

1. **Product resolution:**
   - Look up existing product by `slug` -> update `display_name` if found
   - Fallback: look up by exact `name`
   - If not found: insert new product row with `name`, `display_name`, `slug`

2. **Price record upsert:**
   - Check for existing `price_records` row with same `product_id` AND `week_of = today`
   - If exists: `UPDATE` (idempotent daily re-sync)
   - If not exists: `INSERT` new record

3. **Sync log:** `sync_logs.insert({ extractor_used, status, pdf_url, notes })`

### Sync Trigger Points

| Trigger | Schedule | Endpoint |
|---|---|---|
| **Automated** | Daily at 08:00 AM PHT (UTC+8) | APScheduler CronTrigger (`hour=16` UTC) |
| **Manual** | Admin Dashboard "Sync Now" button | `POST /admin/api/sync` |

---

## 9. Authentication & Security

### Admin Authentication

- **Login:** `POST /admin/api/login` -> credentials checked against `admin_users` (bcrypt verify)
- **Token:** HS256 JWT, payload `{ sub: username, type: "admin", exp: +8h }`
- **Secret Key:** `JWT_SECRET` environment variable
- **Guard:** `AdminAuthMiddleware` checks `Authorization: Bearer <token>` on all `/admin/api/*` routes except `/admin/api/login`

### User (Consumer) Authentication

- **Login/Register:** `/api/reports/login`, `/api/reports/register`
- **Token:** HS256 JWT, payload `{ sub: user_id, email, type: "user", exp: +24h }`
- **Uses same `JWT_SECRET`** but distinguished by `type` claim (`"admin"` vs `"user"`)
- **Guard:** Inline in `reports.py._get_current_user()` — validates Bearer token on protected report routes

### Password Hashing

Both admin and user passwords use **bcrypt** with cost factor **12** (`bcrypt.gensalt(rounds=12)`).

### CORS Policy

Allowed origins:
- `https://alescan.vercel.app` (production)
- `FRONTEND_URL` env var (for staging/local overrides)

Methods: `*` | Headers: `*` | Credentials: `true`

### File Upload Security

Violation/report images are uploaded to Supabase Storage bucket `violation-images` with a UUID-based filename (`violations/{uuid}.{ext}` or `reports/{uuid}.{ext}`). No server-side filename is trusted from the client.

---

## 10. Frontend Application

### Route Map

| Path | Component | Auth Required |
|---|---|---|
| `/` | `LandingPage` | No — Public |
| `/scanner` | `Scanner` | No — Public |
| `/result` | `Result` | No — Public |
| `/user/signup` | `UserSignup` | No — Public |
| `/user/login` | `UserLogin` | No — Public |
| `/report` | `ReportVendor` | Yes — User JWT |
| `/admin/login` | `AdminLogin` | No — Public |
| `/admin` | `AdminDashboard` | Yes — Admin JWT |
| `*` | Redirect to `/` | — |

### Admin Dashboard Sections

The `AdminDashboard.jsx` (~122KB) is a single-page control panel with tab navigation:

| Tab | Content |
|---|---|
| **Overview** | KPI cards (total scans, products, errors, last sync); scan list with date filter (all/daily/weekly/monthly) |
| **Price Sync** | Manual sync trigger; sync log table; `SyncDetailsModal` for price change details per sync |
| **Price Records** | All price records table with category, range, and source |
| **Scan Logs** | Raw scan event log with confidence badges |
| **Error Logs** | Error log table filterable by module |
| **Analytics** | Price trend charts (Recharts LineChart), scan volume bar charts, detection pie chart, commodity performance; PDF export modal with date range filters |
| **Violations** | Admin-managed violation CRUD with photo upload |
| **Vendor Reports** | Consumer-submitted reports with status workflow management |

### PWA Configuration

Configured in `vite.config.js` via `vite-plugin-pwa` + Workbox:

| Asset Type | Cache Strategy | TTL |
|---|---|---|
| Static assets (JS/CSS/HTML/images) | `precacheAndRoute` | Until app update |
| `/prices/*` API responses | `NetworkFirst` | 1 hour (3600s) |
| `/scan`, `/admin`, `/api` | Never cached (deny list) | Always fresh |

Service Worker registration: `registerType: 'autoUpdate'` — SW auto-updates on new build deploy.

The `manifest.json` defines standalone display mode, enabling "Add to Home Screen" on Android/iOS.

### Camera Hook (`useCamera.js`)

Manages the MediaDevices API camera stream:
- Requests `{ video: { facingMode: "environment" } }` (rear-facing camera preferred)
- Handles permission errors and device unavailability gracefully
- Exposes `videoRef` and `captureFrame()` for use in the Scanner page

---

## 11. Scheduler

Located in `backend/scheduler.py`, uses **APScheduler** with `BackgroundScheduler`.

```python
_scheduler = BackgroundScheduler(timezone="Asia/Manila")
_scheduler.add_job(
    run_sync,
    trigger=CronTrigger(hour=16, minute=0),  # 16:00 UTC = 00:00 PHT (midnight)
    id="daily_price_sync",
    replace_existing=True
)
```

> **Note:** The scheduler is configured with `timezone="Asia/Manila"` and `hour=16` (UTC). In practice, `hour=16 UTC` with Asia/Manila timezone resolves to midnight PHT (00:00 PHT). The startup log message says "08:00 AM PHT" — verify the intended run time if a specific hour is required and adjust `hour` accordingly.

The scheduler starts on `@app.on_event("startup")` and shuts down gracefully on `@app.on_event("shutdown")`.

---

## 12. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `SUPABASE_KEY` | Yes | Supabase service role secret key |
| `JWT_SECRET` | Yes | Secret key for HS256 JWT signing (admin and user tokens) |
| `FRONTEND_URL` | Yes | Allowed CORS origin (e.g., `http://localhost:5173`) |
| `GOOGLE_SHEETS_CSV_URL` | No | Override default DA sheet CSV export URL |
| `GOOGLE_SHEET_ID` | No | Override Spreadsheet ID extracted from URL |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | No | Path to service account JSON file (defaults to `service_account.json`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | No | Raw service account JSON string (use in Railway instead of file) |
| `GOOGLE_SHEETS_API_KEY` | No | Google Sheets API key (Strategy 3 fallback) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL (e.g., `https://alescan.up.railway.app`) |
| `VITE_SUPABASE_URL` | No | Supabase URL for direct frontend client (file uploads) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key for frontend Supabase client |

---

## 13. Deployment

### Backend — Railway (Docker)

The backend is containerized using `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# System libs required by OpenCV + YOLOv26 (PyTorch rendering)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender1 libxcb1 libgl1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Deployment steps:**
1. Push `backend/` to Railway via GitHub integration or Railway CLI
2. Set all required environment variables in Railway project settings
3. Ensure `model/best.pt` is present in the repository or committed to the Docker image build context
4. The `vc_redist.x64.exe` in the backend directory is a Windows-only artifact and should be excluded from production Docker builds

**Resource considerations:**
- YOLOv26 model (~20MB weights) + PyTorch (~1GB runtime) requires **at least 2GB RAM**
- First inference after deploy triggers model warmup (~10 second cold start)

---

### Frontend — Vercel

1. Connect GitHub repository to Vercel
2. Set root directory to `frontend/`
3. Configure environment variables: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Vercel auto-detects Vite and runs `vite build`
5. `vercel.json` configures SPA rewrite rules so all client-side routes resolve to `index.html`

**Production URL:** `https://alescan.vercel.app`

---

### Supabase Setup

1. Create a Supabase project and note the Project URL and service role key
2. Run migrations in order via Supabase SQL Editor:
   - `backend/migrations/migration_sheet_prices.sql`
   - `backend/migrations/migration_vendor_reports.sql`
3. Create the `violation-images` storage bucket (set to public for image URL access)
4. Seed the `admin_users` table with at least one admin record:
   ```python
   # Run in a Python shell with the backend venv activated:
   from services.auth import hash_password
   # Then execute in Supabase SQL:
   # INSERT INTO admin_users (username, password_hash)
   # VALUES ('admin', '<output of hash_password("yourpassword")>');
   ```

---

## 14. Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | Any |

### Backend

```bash
cd Alescan-aa/backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Linux/macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Create backend/.env with the variables from Section 12

# Start development server (with live reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API available at: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`  
Health check: `http://localhost:8000/health`

### Frontend

```bash
cd Alescan-aa/frontend

# Install dependencies
npm install

# Configure environment
# Create frontend/.env with VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

App available at: `http://localhost:5173`

> **Note:** The default `vite.config.js` dev server proxy targets point to the Railway production backend. Update the proxy targets in `vite.config.js` to `http://localhost:8000` for full local development.

### Running Tests

```bash
# From backend/
python test_sheet_sync.py    # Test Google Sheet CSV fetch and parse
python test_yolov26.py       # Test model load and dummy inference
```

### Retraining the Model

```bash
cd backend
python train_model.py
# Trained weights will be saved to model/best.pt automatically
```

---

## 15. Data Flow Diagrams

### Consumer Scan Flow

```
User (Mobile Browser / PWA)
        |
        | 1. Open camera (/scanner)
        v
  [Camera Stream - rear-facing]
        |
        | 2. Tap "Scan" - capture frame as JPEG
        v
  POST /scan  (multipart: image file)
        |
        | 3. FastAPI reads image bytes
        v
  vision.run_inference(image_bytes)
        |
        | 4. PIL decode -> RGB -> YOLO model forward pass
        v
  YOLOv26 detection results (bounding boxes + confidence scores)
        |
        | 5. Best box selected (highest confidence)
        |    class_id -> CLASS_NAMES[class_id] -> commodity name
        v
  Confidence gate (>= 0.40)?
     No  -> 422 "low_confidence" --------> User sees retry prompt
     Yes |
         v
        | 6. db.get_latest_price(commodity_name)
        |    slug match -> name match -> Jaccard fuzzy match
        |    -> price_records (latest week_of)
        v
  Price data resolved
        |
        | 7. db.log_scan_event(result, price)
        |    -> scan_events table INSERT
        v
  JSON response -> Client navigates to /result page displaying:
    commodity name, category, specification,
    prevailing price, low/high/avg range,
    confidence badge (High/Medium/Low),
    DA period (month/year), source label
```

---

### Price Sync Flow

```
Trigger: APScheduler (daily) OR POST /admin/api/sync
        |
        v
  sync.run_sync()
        |
        | Stage 1: Fetch
        v
  sheet_fetcher.fetch_sheet_csv()
    Strategy 1: Direct CSV export URL (requests.get, 15s timeout)
    Strategy 2: Service Account OAuth2 -> Sheets API v4
    Strategy 3: API Key -> Sheets API v4
        |
        v
  Raw CSV text (~1000 rows)
        |
        | Stage 2: Parse
        v
  sheet_fetcher.parse_sheet_csv(csv_text)
    -> Extract month/year from first 10 rows
    -> Detect KNOWN_CATEGORIES section headers
    -> Map column indices from header row (COMMODITY, SPEC, UNIT, LOW, HIGH, AVG, PREVAILING)
    -> Parse each commodity row:
         validate price range (1.0 <= p <= 5000.0)
         title-case commodity name
         fallback: prevailing = avg or high or low
        |
        v
  List of ~54 normalized commodity dicts
        |
        | Stage 3: Upsert
        v
  sync._upsert_sheet_prices(records)
    For each commodity:
      -> Resolve or create product (by slug / name)
      -> Check price_record for (product_id, week_of=today)
      -> UPDATE if exists, INSERT if not
        |
        | Stage 4: Log
        v
  sync_logs.insert({ extractor_used="sheet", status, notes })
        |
        v
  Return { status: "success", extractor: "sheet", count: N }
```

---

### Admin Sync Details View Flow

```
Admin requests GET /admin/api/logs/sync
        |
        v
  For each successful sync log entry:
        |
        | 1. Query price_records created within +-15 min of synced_at
        |    (Fallback: query by week_of = synced_at date)
        v
  recs[] - commodities updated in this sync
        |
        | 2. Bulk fetch previous price for each product_id
        |    WHERE week_of < synced_at date ORDER BY week_of DESC
        v
  prev_map{ product_id -> { price, date } }
        |
        | 3. Compute price change for each commodity
        v
  details[] = [
    {
      product: "Bangus",
      price_from: <prev price>,       <- previous sync price
      price_to: <current price>,      <- this sync price
      price_change: price_to - price_from,
      price_change_pct: (change / price_from) * 100,
      prev_date: <date of previous price>
    }
  ]
        |
        v
  Embedded in sync log response -> SyncDetailsModal renders:
    - Arrow indicator: up (red = price increase) / down (green = price drop)
    - Previous price vs current price
    - Absolute change (+-PHP X.XX)
    - Percentage change (+-X.X%)
    - Date of previous record
```

---

*This document covers the complete technical architecture of ALESCAN as of September 2026. For user-facing setup instructions, refer to [README.md](README.md). For terms of service, see [TermsAndConditions.md](TermsAndConditions.md).*
