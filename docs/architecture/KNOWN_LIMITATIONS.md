# NestMate - Known Limitations
> Version: 1.0.0-rc1 | Date: 2026-08-04

These are acknowledged product and technical limitations for V1.0. They are not bugs — they are intentional constraints, deferred features, or accepted trade-offs.

---

## Product Limitations

| ID | Limitation | Reason | Plan |
|----|-----------|--------|------|
| LIM-01 | Premium features are UI stubs only. No payment gateway. | Payment integration requires compliance + regulatory review for India. | V1.1 — Razorpay or Stripe India integration |
| LIM-02 | Phone OTP auth is present but not the primary flow. Email and Google sign-in are preferred. | Firebase Phone Auth billing and TRAI compliance. | V1.1 — Re-enable with proper rate limiting |
| LIM-03 | Aadhaar / DigiLocker e-KYC verification is a UI stub. Admin manual review is the actual flow. | DigiLocker API requires government partnership and paid contract. | V1.2 — Paid DigiLocker API or UIDAI integration |
| LIM-04 | Compatibility scoring is client-computed, rule-based. No machine learning. | ML requires training data from real matches. | V2.0 — ML model after 6 months of usage data |
| LIM-05 | Chat emoji/reaction button exists in UI but is non-functional. | Not yet implemented. | RC2 — fix or remove |
| LIM-06 | Translation coverage is partial (25 key strings). Hindi, Tamil, Telugu translations exist but are incomplete. | Full i18n of 1000+ strings requires professional translation. | V1.1 — expand key coverage |
| LIM-07 | No digital agreement signing workflow beyond stub. | E-signature compliance in India requires legal review. | V1.2 |

---

## Technical Limitations

| ID | Limitation | Reason | Plan |
|----|-----------|--------|------|
| LIM-08 | No server-side rendering or SEO for user profiles and listings. Search engines cannot index dynamic content. | Pure SPA. React is client-rendered. | V1.1 — Next.js migration or static pre-rendering |
| LIM-09 | Geocoding uses Nominatim (OpenStreetMap). Rate-limited to 1 request/second. No billing. | Google Maps requires billing account. | V1.1 — Google Maps if Nominatim rate limit causes UX issues |
| LIM-10 | Push notifications are Web Push only. No Firebase Cloud Messaging (FCM). | FCM setup requires service account on client which adds complexity. | V1.1 — Add FCM for mobile browser support |
| LIM-11 | No email notification system. All notifications are in-app only. | No email service integrated. | V1.1 — SendGrid or Resend integration |
| LIM-12 | Admin dashboard loads metrics via full Firestore collection scans. | Firestore lacks native aggregation for complex queries. | V1.1 — Firestore aggregation queries or Cloud Functions |
| LIM-13 | Match feed loads all users in the same city then filters client-side. Not efficient at scale beyond ~10,000 users/city. | Firestore cannot filter by multiple independent array fields efficiently. | V1.1 — Firestore composite index + server-side filtering |
| LIM-14 | Map view does not cluster markers when many listings are shown in the same area. | Leaflet MarkerCluster not yet integrated. | V1.1 — Add Leaflet.markercluster |
| LIM-15 | No CI/CD pipeline. Deployment is manual. | Not yet set up. | RC2 — GitHub Actions workflow |
| LIM-16 | No bundle size tracking or performance budgets. | Build analysis not integrated into workflow. | RC2 — rollup-plugin-visualizer |

---

## Security Limitations (Acceptable for V1)

| ID | Limitation | Risk Level | Plan |
|----|-----------|------------|------|
| LIM-17 | Admin auth relies on email domain matching in Firestore rules (@nestmate.com), not Firebase custom claims. | Low — email domain is a reasonable guard for V1. | RC2 — Firebase custom claims for admin role |
| LIM-18 | Storage rules allow any authenticated user to upload to listings/ and chats/ without verifying they own the listing. | Low — Firestore rules still enforce ownership for data writes. | V1.1 — tighten storage rules to verify ownership |
| LIM-19 | /dev/seed route has no auth guard in production. | Low — URL is obscure and the page only seeds dummy data. | RC2 — add admin auth guard or remove |

