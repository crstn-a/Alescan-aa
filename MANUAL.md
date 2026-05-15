# ALESCAN — Technical & User Manual

**Palengke SRP Scanner**
**Prototype Version 1.0 · May 2026**

> ALESCAN is a free, web-based tool that helps market shoppers in Olongapo City check if the prices of basic goods (e.g.,pork, chicken, tilapia) are within the official government price limits. You simply point your phone camera at the product, and the app shows you the correct price.

---

## Table of Contents

1. [What is ALESCAN?](#1-what-is-alescan)
2. [Who is This Manual For?](#2-who-is-this-manual-for)
3. [What You Need](#3-what-you-need)
4. [How to Open ALESCAN](#4-how-to-open-alescan)
5. [For Shoppers — How to Use the Scanner](#5-for-shoppers--how-to-use-the-scanner)
   - [Step 1: Open the Scanner](#step-1-open-the-scanner)
   - [Step 2: Point Your Camera](#step-2-point-your-camera)
   - [Step 3: Tap "Scan"](#step-3-tap-scan)
   - [Step 4: View the Price Result](#step-4-view-the-price-result)
   - [Step 5: Scan Another Item](#step-5-scan-another-item)
   - [Leaving the Scanner](#leaving-the-scanner)
   - [What If the Item is "Not Recognized"?](#what-if-the-item-is-not-recognized)
6. [Installing ALESCAN on Your Phone (Optional)](#6-installing-alescan-on-your-phone-optional)
7. [Items You Can Scan](#7-items-you-can-scan)
8. [Understanding the Scan Result Screen](#8-understanding-the-scan-result-screen)
9. [Frequently Asked Questions (Shoppers)](#9-frequently-asked-questions-shoppers)
10. [For Administrators — Dashboard Guide](#10-for-administrators--dashboard-guide)
    - [How to Log In](#how-to-log-in)
    - [Dashboard Overview](#dashboard-overview)
    - [Analytics](#analytics)
    - [AI Evaluation](#ai-evaluation)
    - [Violations (Consumer Complaints)](#violations-consumer-complaints)
    - [Scan Logs](#scan-logs)
    - [Price Records](#price-records)
    - [Sync Logs](#sync-logs)
    - [Error Logs](#error-logs)
    - [Manual Price Sync](#manual-price-sync)
    - [Automatic Price Updates](#automatic-price-updates)
    - [Logging Out](#logging-out)
11. [Technical Overview](#11-technical-overview)
    - [System Architecture](#system-architecture)
    - [How Prices Are Updated](#how-prices-are-updated)
    - [How Scanning Works](#how-scanning-works)
    - [Security](#security)
    - [Supported Commodities](#supported-commodities)
12. [Troubleshooting](#12-troubleshooting)
13. [Contact & Support](#13-contact--support)

---

## 1. What is ALESCAN?

ALESCAN is a **free public service tool** for Olongapo City's public market. It helps consumers (shoppers) verify whether the price of basic goods such as pork, chicken, and tilapia falls within the **Suggested Retail Price (SRP)** set by the government.

**How it works in simple terms:**

1. You open the website on your phone.
2. You point your camera at a product in the market.
3. The app identifies the product and shows you the **official maximum price** per kilogram.

The prices shown come directly from the **Department of Agriculture's Bantay Presyo** program and are updated every week.

---

## 2. Who is This Manual For?

This manual is written for **two types of users**:

| User Type | What They Do |
|-----------|-------------|
| **Shoppers (Consumers)** | Use their phone to scan products and check prices at the market. No account or login needed. |
| **Administrators** | Manage the system: update prices, review scan history, handle complaints, and monitor system health. Login required. |

---

## 3. What You Need

### For Shoppers

- A **smartphone or tablet** with a working camera
- An **internet connection** (mobile data or Wi-Fi)
- A **web browser** (Chrome, Safari, Firefox, or any modern browser)
- **No app download needed** — it works directly in your browser

### For Administrators

- A **computer or tablet** with a web browser
- Your **admin username and password** (provided by the system administrator)
- An **internet connection**

---

## 4. How to Open ALESCAN

1. Open your phone's **web browser** (Chrome, Safari, etc.).
2. Type the following address in the search/address bar:

   **https://alescan.vercel.app**

3. Press **Enter**.
4. The ALESCAN home page will appear.

---

## 5. For Shoppers — How to Use the Scanner

### Step 1: Open the Scanner

From the home page, tap the green **"Start Scanning"** button. Your phone will ask for permission to use the camera.

- Tap **"Allow"** when asked.
- The camera view will appear on your screen.

> **First-time users:** Your phone will only ask for camera permission once. If you accidentally tapped "Block," see the Troubleshooting section at the end of this manual.

### Step 2: Point Your Camera

- Hold your phone so the camera faces the product you want to check.
- Keep the product inside the **green frame** shown on screen.
- When the app recognizes the item, you will see a green label that says something like **"Whole Chicken Detected"** or **"Pork Belly Liempo Detected"**.
- A green scanning line moves across the frame while the app is looking.

### Step 3: Tap "Scan"

- Once you see the product name appear, tap the large **green circle button** at the bottom of the screen.
- Wait a moment while the app processes your scan.
- A brief white flash will appear — this means the photo was captured.

### Step 4: View the Price Result

After scanning, you will see a **result screen** showing:

| Information | What It Means |
|-------------|--------------|
| **Product Name** | The name of the item you scanned (e.g., "Whole Chicken") |
| **Official SRP** | The maximum price per kilogram set by the government (shown in large numbers with ₱ sign) |
| **Detection Confidence** | How sure the app is about what it detected (shown as a percentage bar — High, Medium, or Low) |
| **Source** | Where the price data came from (Department of Agriculture Bantay Presyo) |
| **Week of** | The date the price data was last updated |

> **Important:** The price shown is a **government reference price** only. Actual market prices may vary slightly. If you believe a vendor is charging too much, report it to your local Public Market representative or the Department of Agriculture office.

### Step 5: Scan Another Item

Tap the **"Scan another commodity"** button at the bottom of the result screen to go back to the scanner and check another product.

### Leaving the Scanner

To leave the scanner and go back to the home page:

1. Tap the red **"Exit"** button in the top-left corner.
2. A pop-up will ask: **"Exit Scanner?"**
3. Tap **"Exit"** to confirm, or **"Cancel"** to stay.

### What If the Item is "Not Recognized"?

If the app cannot identify the product, a pop-up will appear saying **"Not Recognized"**. This means:

- The item is not in the app's list of supported products (see Section 7), **or**
- The camera was too far from the product.

**What to do:**

- Move your phone **closer** to the product.
- Make sure there is enough **light**.
- Try scanning again.
- Tap **"Okay"** to close the pop-up and try again.

---

## 6. Installing ALESCAN on Your Phone (Optional)

ALESCAN can be **installed on your phone** like a regular app — without going to the App Store or Play Store. This is called a **Progressive Web App (PWA)**.

### On Android (Chrome):

1. Open **https://alescan.vercel.app** in Chrome.
2. Tap the **three dots (⋮)** menu in the top-right corner.
3. Tap **"Add to Home screen"** or **"Install app"**.
4. Tap **"Install"** to confirm.
5. The ALESCAN icon will now appear on your home screen.

### On iPhone (Safari):

1. Open **https://alescan.vercel.app** in Safari.
2. Tap the **Share button** (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top-right corner.
5. The ALESCAN icon will now appear on your home screen.

> **Benefit:** Once installed, you can open ALESCAN directly from your home screen. Previously viewed prices may also be available even without an internet connection.

---

## 7. Items You Can Scan

ALESCAN currently supports the following market items:

| Item | What to Look For |
|------|-----------------|
| **Pork Belly (Liempo)** | Fresh pork belly cuts commonly sold in wet markets |
| **Whole Chicken** | Whole dressed chicken |
| **Tilapia (Local)** | Fresh whole tilapia fish |

> **Note:** More items may be added in future updates. If you scan an item not on this list, the app will show a "Not Recognized" message.

---

## 8. Understanding the Scan Result Screen

Here is a breakdown of everything you see on the result screen:

### Product Card (Green Section at Top)
Shows the **name of the identified product** with an icon (🐔 for chicken, 🥩 for pork, 🐟 for tilapia).

### Official SRP Card
Shows the **official government price** in large numbers. This is the maximum price per kilogram. For example, **₱220.00** means the product should not cost more than ₱220 per kilogram.

### Detection Confidence Bar
Shows how confident the app is about its identification:

| Level | Meaning |
|-------|---------|
| **High (75% and above)** | The app is very sure about the product — shown in green |
| **Medium (60–74%)** | The app is fairly sure — shown in yellow |
| **Low (below 60%)** | The app is not very sure — shown in red; consider scanning again |

### Source Information
Shows the **name of the official price bulletin** and the **week** the price was published.

### Disclaimer
A small note reminding you that this is a reference price and actual market prices may vary.

---

## 9. Frequently Asked Questions (Shoppers)

**Q: Is this app free?**
A: Yes, completely free. No charges, no ads.

**Q: Do I need to create an account or sign up?**
A: No. Just open the website and start scanning.

**Q: Does this work on any phone?**
A: It works on any smartphone with a camera and a modern web browser (Chrome, Safari, Firefox, etc.).

**Q: Why can't I scan fruits or vegetables?**
A: The current version only supports pork, chicken, and tilapia. More items may be added in the future.

**Q: The scan result says "Low" confidence. What should I do?**
A: Try moving the camera closer to the product, ensure good lighting, and scan again.

**Q: Where do these prices come from?**
A: The prices come from the **Department of Agriculture Bantay Presyo** weekly price bulletin. They are automatically updated every Monday.

**Q: Can I use this outside of Olongapo City?**
A: The app is designed for Olongapo City Public Market, but anyone with internet access can open it. The prices shown are based on the DA Bantay Presyo national SRP data.

---

## 10. For Administrators — Dashboard Guide

This section is for authorized personnel who manage the ALESCAN system (e.g., City Agriculture Office staff, IT administrators).

### How to Log In

1. Open your browser and go to: **https://alescan.vercel.app/admin/login**
2. Enter your **Username** and **Password**.
3. Click **"Sign In"**.
4. If your credentials are correct, you will be taken to the **Admin Dashboard**.

> **Note:** Your login session lasts for **8 hours**. After that, you will need to sign in again. If you see an error message, double-check your username and password.

### Dashboard Overview

The **Overview** page is the first thing you see after logging in. It shows:

| Card | What It Shows |
|------|--------------|
| **Total Scans** | The total number of times shoppers have used the scanner |
| **Products** | The number of product types in the system |
| **Active Prices** | How many products currently have an up-to-date price |
| **Errors** | The number of system errors recorded |
| **Last Sync** | When the price data was last updated |

Below the cards, you will see a list of the **5 most recent scans** showing what product was scanned, when, and the confidence level.

**Quick Actions:**

- **Trigger Sync** — Manually update prices from the latest DA bulletin (see "Manual Price Sync" below).
- **View Scan Logs** — Jump to the full scan history.
- **View Sync Logs** — Jump to the sync history.

### Analytics

The **Analytics** page shows visual charts and graphs to help you understand usage patterns:

- **Price Trends** — A line chart showing how SRP prices for each commodity have changed over time.
- **Scan Volume** — A bar chart showing how many scans happen each day.
- **Detection Confidence** — A breakdown of how accurately the scanner identifies products.
- **Per-Commodity Performance** — How often each product type is scanned.

### AI Evaluation

The **AI Evaluation** page shows technical performance scores for the scanning system:

- **Accuracy** — How often the scanner correctly identifies products.
- **Precision** — Of all the times the scanner said it found a product, how often was it correct.
- **Recall** — Of all the actual products, how many did the scanner successfully find.
- **F1 Score** — An overall performance score combining precision and recall.

> These numbers help the technical team determine if the scanning model needs improvement.

### Violations (Consumer Complaints)

The **Violations** page lets administrators manage consumer complaints about overpriced goods.

**Submitting a Complaint:**

1. Fill in the **Consumer Name**, **Store Number**, and **Complaint Description**.
2. Optionally attach a **supporting photo**.
3. Click **"Submit Complaint"**.

**Managing Complaints:**

Each complaint has a status that can be changed:

| Status | Meaning |
|--------|---------|
| **Submitted** | Complaint has been received |
| **In Progress** | Complaint is being investigated |
| **Resolved** | The issue has been addressed |
| **Archived** | Complaint is closed and stored for records |

To change a status, use the dropdown menu next to each complaint in the table. You can also click **"Edit"** to update the complaint details.

### Scan Logs

The **Scan Logs** page shows a table of all scan events, including:

- **Commodity** — What product was detected
- **Confidence** — How sure the scanner was (shown as a percentage)
- **Price Shown** — The SRP that was displayed to the shopper
- **Scanned At** — Date and time of the scan

This helps you see what products are being scanned most often and how well the scanner is performing.

### Price Records

The **Price Records** page shows all current official prices in the system:

- **Commodity** — Product name
- **Official SRP** — Price per kilogram
- **Week Of** — Which week the price is effective for
- **Source** — The name of the official DA bulletin

### Sync Logs

The **Sync Logs** page shows the history of price updates:

- **Status** — Whether the update was successful, failed, or partial
- **Extractor** — Which method was used to read the price bulletin
- **Notes** — Any details about what happened during the update
- **Synced At** — When the update occurred

### Error Logs

The **Error Logs** page shows any system errors that have occurred:

- **Module** — Which part of the system had the error
- **Message** — A description of what went wrong
- **Date** — When the error happened

> Share this information with your IT support team when reporting issues.

### Manual Price Sync

To manually update prices from the latest DA Bantay Presyo bulletin:

1. Go to the **Overview** page.
2. Click the **"Trigger Sync"** button.
3. Wait for the process to complete (this may take a few moments).
4. A notification will appear at the bottom of the screen:
   - **Green** = Success — prices were updated successfully.
   - **Yellow** = Warning — prices were partially updated.
   - **Red** = Error — the update failed; contact IT support.

### Automatic Price Updates

Prices are **automatically updated every Monday at 8:00 AM** (Philippine Time). You do not need to do anything — the system handles this on its own.

You can verify the last automatic update by checking the **Last Sync** card on the Overview page.

### Logging Out

1. Click the **"Sign Out"** button in the bottom of the left sidebar.
2. A confirmation dialog will appear.
3. Click **"Yes, sign out"** to log out, or **"No, stay"** to remain logged in.

---

## 11. Technical Overview

This section provides a high-level explanation of how ALESCAN works behind the scenes. It is intended for administrators, IT support staff, and project stakeholders.

### System Architecture

ALESCAN is made up of two main parts:

| Component | Purpose |
|-----------|---------|
| **Frontend (Website)** | The part you see and interact with — the home page, scanner, and admin dashboard. This runs in your web browser. |
| **Backend (Server)** | The part that runs behind the scenes — it processes scans, manages the database, and fetches price updates. |

**How they connect:**

```
Your Phone (Browser)  ⟷  Frontend (Website)  ⟷  Backend (Server)  ⟷  Database (Supabase)
                                                        ⟷  DA Bantay Presyo (Price Source)
```

- The **Frontend** is hosted on **Vercel** (a web hosting service).
- The **Backend** is hosted on **Railway** (a server hosting service).
- The **Database** is hosted on **Supabase** (a cloud database service).

### How Prices Are Updated

1. Every Monday at 8:00 AM, the system automatically downloads the latest **DA Bantay Presyo** price bulletin (a PDF document).
2. The system reads the PDF and extracts the relevant price information.
3. The extracted prices are cleaned up and organized.
4. The cleaned prices are saved to the database, replacing the old prices.
5. When a shopper scans a product, the latest price is pulled from the database and displayed.

This can also be triggered manually by an administrator at any time from the dashboard.

### How Scanning Works

1. The shopper opens the scanner, which activates their phone camera.
2. A computer vision model called **YOLOv11** runs directly in the browser to identify the product in real-time.
3. When the shopper taps "Scan," a photo is captured and sent to the server.
4. The server confirms the product identity and looks up the latest official price.
5. The result (product name + official price) is sent back to the phone and displayed.

### Security

- **Shopper access** requires no login. The public scanner is open to everyone.
- **Admin access** is protected by a username and password.
- Admin sessions last for **8 hours** before requiring re-authentication.
- All admin actions are verified by the server on every request.
- Passwords are securely stored (never saved as plain text).

### Supported Commodities

| ID | Product | Display Name |
|----|---------|-------------|
| 0 | Pork Belly | Pork Belly Liempo |
| 1 | Tilapia | Tilapia (Local) |
| 2 | Chicken | Whole Chicken |

---

## 12. Troubleshooting

### "Camera permission denied"

If you accidentally blocked camera access:

**On Android (Chrome):**
1. Tap the **lock icon** (🔒) next to the website address.
2. Tap **"Permissions"** or **"Site settings"**.
3. Change **Camera** to **"Allow"**.
4. Reload the page.

**On iPhone (Safari):**
1. Open your phone's **Settings** app.
2. Scroll down and tap **Safari**.
3. Tap **Camera** and select **"Allow"**.
4. Go back to the website and reload.

### "Camera in use"

Another app might be using your camera. Close any other camera or video apps and try again.

### "Not Recognized" keeps appearing

- Move **closer** to the product (about 20–30 cm away).
- Make sure there is good **lighting** — avoid dark or shadowy areas.
- Keep the product **centered** inside the green frame on screen.
- Make sure you are scanning one of the [supported items](#7-items-you-can-scan).

### Scanner is slow or not responding

- Check your **internet connection**.
- Close unused browser tabs or apps.
- Try reloading the page.

### Admin: "Sync failed" error

- Check if the backend server is running.
- Verify the internet connection.
- Check the **Error Logs** page for details.
- Contact IT support with the error message.

### Admin: Logged out unexpectedly

- Your session expires after **8 hours**. Simply log in again.
- If this happens frequently, check your internet connection — unstable connections may interrupt sessions.

---

## 13. Contact & Support

For questions, technical issues, or feedback about ALESCAN, contact:

- **Project Team** — ALESCAN Development Team
- **Local Authority** — Olongapo City Public Market
- **Price Data Source** — Department of Agriculture, Bantay Presyo Program

---

*Manual for the ALESCAN Project — A Vision-Based Centralized SRP Verification Scanner for Public Markets.*