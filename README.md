# 🏠 NestMate — AI-Powered Roommate & Room Discovery Platform

> **Version**: 1.0.0-rc1  
> **Status**: Production Release Candidate (RC1)  
> **Stack**: React 19, TypeScript 5, Vite 7, Tailwind CSS, Firebase (Auth, Firestore, Storage)

---

## 📌 Overview

NestMate is an AI-powered roommate matching and verified property discovery platform built specifically for young professionals and students in urban India.

### Key Features
- **Smart Roommate Matching**: Compatibility scoring based on lifestyle preferences, habits, budget, and location.
- **Verified Property Listings**: Detailed property posts with multi-photo carousels, amenity tags, and verified owner trust badges.
- **Real-Time Communication**: In-app real-time chat with typing indicators, photo attachments, and controlled phone number exchange.
- **Privacy & PII Protection**: Client-side PII isolation architecture keeping phone/email numbers in owner-accessible collection stores.
- **Interactive Map Search**: Leaflet-powered geolocation map view of available rooms and potential flatmates.
- **Admin Moderation Portal**: Multi-tab management for user verifications, listing reviews, user safety reports, and system broadcasts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19.x (TypeScript 5.9) |
| **Build System** | Vite 7.x (Code-split vendor chunks) |
| **Styling** | Tailwind CSS 3.x + shadcn/ui primitives |
| **State Management** | Zustand 5.x |
| **Backend & Database** | Cloud Firestore + Firebase Authentication + Firebase Storage |
| **Mapping & Geocoding** | Leaflet + Nominatim OpenStreetMap API |
| **Testing** | Vitest 4.x (Unit tests for core logic) |
| **Deployment** | Firebase Hosting (SPA rewrites, CDN) |

---

## 📚 Documentation Index

All technical, architecture, and operational documentation is organized in `docs/`:

### 🏗️ Architecture & Database
- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) — System components, security model, PII isolation architecture, and state flow.
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md) — Firestore collection specifications, field types, security rules, and index definitions.
- [Known Limitations](docs/architecture/KNOWN_LIMITATIONS.md) — Technical, product, and architectural constraints.

### 🔌 API Reference
- [API & Hooks Reference](docs/api/API_REFERENCE.md) — Documentation of custom React hooks (`useAuth`, `useMatches`, `useListings`, `useChat`, `useAdmin`, `useUserProfile`).

### 🚀 Deployment & Setup
- [Environment Setup](docs/deployment/ENVIRONMENT_SETUP.md) — Prerequisites, environment variables, local setup, and emulator config.
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) — Firebase build scripts, hosting release commands, CI/CD, and rollback steps.

### 📋 Technical Debt & Changelog
- [Technical Debt](TECHNICAL_DEBT.md) — Open debt register, paid-down items, and maintainability priorities.
- [Changelog](CHANGELOG.md) — Version history and release notes.

### 📁 RC1 Engineering Archive
- [RC1 Release Checklist](docs/archive/rc1/RC1_RELEASE_CHECKLIST.md) — Feature QA pass/fail matrix, known issues, and manual QA guide.
- [Final Release Report](docs/archive/rc1/FINAL_RELEASE_REPORT.md) — Final engineering sign-off report.
- [Launch Checklist](docs/archive/rc1/LAUNCH_CHECKLIST.md) — Day-of-launch operational go/no-go checklist.
- [Feature Roadmap](docs/archive/rc1/FEATURE_ROADMAP.md) — Post-v1 feature roadmap and backlog.
- [Mobile Design Audit](docs/archive/rc1/MOBILE_DESIGN_AUDIT.md) — Mobile UX and responsive design evaluation.
- [Project Status](docs/archive/rc1/PROJECT_STATUS.md) — Milestone completion and component status.

---

## ⚡ Quick Start

```bash
# 1. Change directory to the app folder
cd app

# 2. Install dependencies
npm install

# 3. Create app/.env.local with Firebase credentials
# (See docs/deployment/ENVIRONMENT_SETUP.md for details)

# 4. Start local development server
npm run dev

# 5. Run test suite
npm test
```

---

## 📜 License

Private & Proprietary. All rights reserved. NestMate Team 2026.

