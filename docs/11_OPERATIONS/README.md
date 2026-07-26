# 11 — Operations

> **Purpose**: Roadmap, known issues, architecture decision records, future improvements  
> **Audience**: Product managers, developers, investors  
> **Dependencies**: All previous sections  
> **Related**: [01 Product](../01_PRODUCT/README.md) · [02 Requirements](../02_REQUIREMENTS/README.md)

---

## Product Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Firebase Auth (email, Google, phone OTP)
- [x] Seeker and Owner onboarding wizards (19 steps each)
- [x] Firestore schema design (13+ collections)
- [x] Compatibility scoring algorithm (10-question quiz)
- [x] Match discovery with filters and pagination
- [x] Real-time chat with typing indicators
- [x] Connection request system (send/accept/reject)
- [x] Room listing CRUD with image uploads
- [x] Trust badge system (4-tier ladder)
- [x] Profile completeness meter
- [x] Admin panel (7 sections)
- [x] Leaflet map integration
- [x] Notifications (in-app + browser push)
- [x] i18n support (4 Indian languages)
- [x] Dark mode
- [x] SEO optimization

### Phase 2: Growth (🔜 Next)
- [ ] Razorpay payment integration (scaffolded, not live)
- [ ] Enforce premium connect limits (code exists, disabled)
- [ ] Digital rent agreement builder (Firestore schema exists)
- [ ] Email notifications via EmailJS
- [ ] Cloud Functions for aggregate metrics
- [ ] Server-side input validation
- [ ] PWA offline support

### Phase 3: Scale (📋 Planned)
- [ ] AI-powered match recommendations
- [ ] Video verification (highest trust tier)
- [ ] In-app video calls
- [ ] WhatsApp bot integration
- [ ] City expansion beyond 6 metros
- [ ] Landlord subscription tier (Corporate plan)
- [ ] Analytics dashboard (user behavior)
- [ ] A/B testing infrastructure

---

## Known Issues

### Functional Issues

| # | Area | Issue | Impact | Root Cause |
|---|------|-------|--------|-----------|
| 1 | Connections | `FREE_CONNECT_LIMIT` defined but not enforced | Low | Code comment: "Platform is 100% free" — intentional for now |
| 2 | Admin Metrics | All metrics computed by scanning full collections | Medium | No Cloud Functions for pre-aggregated counters |
| 3 | Phone Login | Legacy phone login pages exist alongside new auth flow | Low | Two auth entry points: `AuthPage.tsx` + `PhoneLogin.tsx` |
| 4 | tRPC Router | `api/router.ts` scaffold exists but is unused | None | Future backend API planning |
| 5 | Providers | `providers/` directory is empty | None | Firebase SDK doesn't need React providers |

### Performance Considerations

| # | Area | Issue | Current Mitigation |
|---|------|-------|--------------------|
| 1 | Match loading | Full user scan for matching | Firestore indexes + pagination (20/page) |
| 2 | Chat subscriptions | N+1 subscriptions for unread counts | Per-room subscription management |
| 3 | Geocoding | Rate-limited external API | Global queue with 1.1s interval |
| 4 | Bundle size | Firebase SDK is large | Manual chunk splitting in Vite |
| 5 | Image loading | Unsplash URLs for seed data | `loading="lazy"` on all images |

### Security Considerations

→ See [10 Security → Known Security Considerations](../10_SECURITY/README.md)

---

## Architecture Decision Records (ADRs)

### ADR-001: No Backend Server

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Context** | 2-person team, bootstrap budget, zero server costs needed |
| **Decision** | Use Firebase SDK directly from client. No Express/Node server. |
| **Consequences** | ✅ Zero server costs, fast development. ❌ Business logic in client, limited server-side validation. |
| **Alternatives** | Cloud Functions for sensitive operations (considered for Phase 2) |

### ADR-002: Zustand over Redux/Context

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Context** | Needed lightweight UI state management alongside Firebase real-time data |
| **Decision** | Zustand for UI-only state. Firebase hooks for all data. |
| **Consequences** | ✅ Simple, tiny bundle, no boilerplate. ❌ No data caching layer (Firestore handles it). |

### ADR-003: Email Domain for Admin Auth

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted (with planned migration) |
| **Context** | Need admin access control without custom backend |
| **Decision** | Check `email.endsWith('@nestmate.com')` in both client and Firestore rules |
| **Consequences** | ✅ Works without Cloud Functions. ❌ Anyone with a `@nestmate.com` email is admin. |
| **Migration Plan** | Move to Firebase custom claims when Cloud Functions are added |

### ADR-004: Client-Side Image Compression

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Context** | Firebase Storage free tier has 5GB limit |
| **Decision** | Compress all images client-side via Canvas API (1200px, 80% JPEG) |
| **Consequences** | ✅ Massive storage savings, zero server processing. ❌ Processing happens on user's device. |

### ADR-005: Nominatim over Google Maps

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Context** | Bootstrap budget, need geocoding for map features |
| **Decision** | Use Nominatim (OpenStreetMap) free API instead of Google Maps |
| **Consequences** | ✅ Free, privacy-respecting. ❌ Rate-limited (1req/sec), lower accuracy for Indian localities. |

### ADR-006: Compatibility Algorithm Design

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Context** | Need to quantify roommate compatibility |
| **Decision** | Distance-based vector similarity on quiz answer ordinals, not simple exact-match |
| **Consequences** | ✅ Partial credit for similar answers. ❌ Assumes ordinal relationship between options. |

---

## Scaling Considerations

| Area | Current State | At 10K Users | Recommendation |
|------|--------------|-------------|----------------|
| **Firestore reads** | < 1K/day | ~50K/day | Add read caching, Cloud Functions for aggregation |
| **Admin metrics** | Full collection scans | Very slow | Pre-compute with scheduled Cloud Functions |
| **Match query** | Scan users by city | ~1000s of docs | Add Algolia or Typesense for full-text search |
| **Chat** | Per-room subscriptions | Memory pressure | Virtualize chat list, lazy-load rooms |
| **Storage** | ~100MB images | ~5GB+ | Consider CDN for images, review compression settings |
| **Geocoding** | 1 req/1.1s queue | Bottleneck | Cache aggressively, consider batch geocoding |

---

## Future Feature Ideas

| Feature | Priority | Effort | Dependency |
|---------|----------|--------|-----------|
| Digital rent agreements | High | Medium | `agreements` collection exists |
| Premium payments (Razorpay) | High | Low | SDK scaffolded |
| Email notifications | Medium | Low | EmailJS installed |
| Cloud Functions backend | Medium | High | Firebase infrastructure ready |
| AI match recommendations | Medium | High | Needs ML pipeline |
| Video verification | Low | High | Needs video recording + storage |
| In-app video calls | Low | Very High | WebRTC or third-party SDK |
| Multi-city search | Low | Low | Remove single-city filter constraint |
| Roommate groups (3+ people) | Low | Medium | Schema extension needed |

---

*→ Next: [12 QA Reference](../12_QA_REFERENCE/README.md)*
