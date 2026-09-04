/**
 * Sprint 3C — Firestore Security Rules emulator tests.
 *
 * MANDATORY production-readiness gate: these tests exercise the REAL
 * security rules against the Firebase Firestore Emulator — not source-code
 * inspection. They cover positive AND negative cases for the highest-risk
 * authorization boundaries:
 *
 *   - connections: creation, listing attribution ownership enforcement
 *   - users: trust fields (isVerified etc.) admin-only writes
 *   - reports: reporter identity binding, admin-only reads
 *   - listings: suspended/banned owners blocked
 *   - chat: participant authorization
 *
 * Run with:  npm run test:rules   (starts the Firestore emulator)
 * The suite is SKIPPED unless RUN_RULES_TESTS=1 so plain `npm test`
 * never fails due to a missing emulator.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    assertSucceeds,
    assertFails,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    serverTimestamp,
    type Firestore,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runRules = process.env.RUN_RULES_TESTS === '1';
const d = runRules ? describe : describe.skip;

const PROJECT_ID = 'rules-test-nestmate';
const RULES_PATH = resolve(__dirname, 'firestore.rules');

const ADMIN_EMAIL = 'admin@nestmate.test';

// Fixture UIDs
const SEEKER = 'seeker-1';
const OWNER = 'owner-1';
const OTHER_OWNER = 'owner-2';
const ATTACKER = 'attacker-1';

let env: RulesTestEnvironment;

// rules-unit-testing bundles its own firebase types; cast to the app's
// Firestore so the shared firebase/firestore helpers type-check.
function fsOf(raw: ReturnType<RulesTestEnvironment['authenticatedContext']> extends never ? never : { firestore(): unknown }): Firestore {
    return raw.firestore() as unknown as Firestore;
}

/**
 * Rules-DISABLED fixture writes. The temporary context is terminated when
 * the callback returns, so ALL writes must happen inside `fn`.
 * Needed because the admins registry cannot bootstrap itself through the
 * rules (chicken-and-egg).
 */
async function seedDisabled(fn: (db: Firestore) => Promise<void>): Promise<void> {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await fn(fsOf(ctx));
    });
}

/** Admin context THROUGH THE RULES (requires admins/{email} to exist). */
function adminDb(): Firestore {
    return fsOf(env.authenticatedContext('seed-admin', { email: ADMIN_EMAIL }));
}
function seekerDb(): Firestore {
    return fsOf(env.authenticatedContext(SEEKER));
}
function ownerDb(): Firestore {
    return fsOf(env.authenticatedContext(OWNER));
}
function attackerDb(): Firestore {
    return fsOf(env.authenticatedContext(ATTACKER));
}
function bannedDb(): Firestore {
    return fsOf(env.authenticatedContext('banned-1'));
}

async function seed() {
    await seedDisabled(async (db) => {
        // Admin registry entry (email-keyed, per ADMIN_BOOTSTRAP.md)
        await setDoc(doc(db, 'admins', ADMIN_EMAIL), { addedAt: Date.now() });
        // Users
        await setDoc(doc(db, 'users', SEEKER), { name: 'Seeker', role: 'seeker', status: 'active', onboardingComplete: true });
        await setDoc(doc(db, 'users', OWNER), { name: 'Owner', role: 'owner', status: 'active', onboardingComplete: true });
        await setDoc(doc(db, 'users', OTHER_OWNER), { name: 'Other Owner', role: 'owner', status: 'active', onboardingComplete: true });
        await setDoc(doc(db, 'users', ATTACKER), { name: 'Attacker', role: 'seeker', status: 'active', onboardingComplete: true });
        await setDoc(doc(db, 'users', 'banned-1'), { name: 'Banned', role: 'owner', status: 'banned', onboardingComplete: true });
        // Listings
        await setDoc(doc(db, 'listings', 'listing-owned-by-owner'), { title: 'Room A', ownerId: OWNER, city: 'Chennai', status: 'active' });
        await setDoc(doc(db, 'listings', 'listing-owned-by-other'), { title: 'Room B', ownerId: OTHER_OWNER, city: 'Chennai', status: 'active' });
    });
}

d('Firestore security rules (emulator)', () => {
    beforeAll(async () => {
        env = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: { rules: readFileSync(RULES_PATH, 'utf8') },
        });
        await seed();
    });

    afterAll(async () => {
        await env.cleanup();
    });

    // ── Connections ────────────────────────────────────────────────
    it('UNAUTHENTICATED user CANNOT create a connection', async () => {
        await assertFails(
            addDoc(collection(env.unauthenticatedContext().firestore() as unknown as Firestore, 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending', createdAt: serverTimestamp(),
            })
        );
    });

    it('seeker CAN create a pending connection (no listingId — legacy shape)', async () => {
        await assertSucceeds(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending', createdAt: serverTimestamp(),
            })
        );
    });

    it('seeker CAN create a connection attributed to a listing OWNED BY THE RECIPIENT', async () => {
        await assertSucceeds(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending',
                listingId: 'listing-owned-by-owner', createdAt: serverTimestamp(),
            })
        );
    });

    it('ATTACKER CANNOT claim a listing owned by someone else on a connection', async () => {
        // Attacker sends interest to OWNER but attributes OTHER_OWNER's listing.
        await assertFails(
            addDoc(collection(attackerDb(), 'connections'), {
                fromUserId: ATTACKER, toUserId: OWNER, status: 'pending',
                listingId: 'listing-owned-by-other', createdAt: serverTimestamp(),
            })
        );
    });

    it('connection attributed to a CLOSED listing is REJECTED', async () => {
        await seedDisabled(async (db) => {
            await setDoc(doc(db, 'listings', 'listing-closed'), { title: 'Closed Room', ownerId: OWNER, city: 'Chennai', status: 'closed' });
        });
        await assertFails(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending',
                listingId: 'listing-closed', createdAt: serverTimestamp(),
            })
        );
    });

    it('connection attributed to a PAUSED listing is REJECTED', async () => {
        await seedDisabled(async (db) => {
            await setDoc(doc(db, 'listings', 'listing-paused'), { title: 'Paused Room', ownerId: OWNER, city: 'Chennai', status: 'paused' });
        });
        await assertFails(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending',
                listingId: 'listing-paused', createdAt: serverTimestamp(),
            })
        );
    });

    it('connection attributed to a FILLED listing is REJECTED', async () => {
        await seedDisabled(async (db) => {
            await setDoc(doc(db, 'listings', 'listing-filled'), { title: 'Filled Room', ownerId: OWNER, city: 'Chennai', status: 'filled' });
        });
        await assertFails(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending',
                listingId: 'listing-filled', createdAt: serverTimestamp(),
            })
        );
    });

    it('connection with NONEXISTENT listingId is REJECTED', async () => {
        await assertFails(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending',
                listingId: 'no-such-listing', createdAt: serverTimestamp(),
            })
        );
    });

    it('sender CANNOT self-accept their own pending request', async () => {
        const ref = await assertSucceeds(
            addDoc(collection(seekerDb(), 'connections'), {
                fromUserId: SEEKER, toUserId: OWNER, status: 'pending', createdAt: serverTimestamp(),
            })
        );
        await assertFails(
            updateDoc(doc(env.authenticatedContext(SEEKER).firestore() as unknown as Firestore, 'connections', ref.id), { status: 'accepted' })
        );
    });

    // ── Trust fields ───────────────────────────────────────────────
    it('NORMAL USER CANNOT grant themselves isVerified', async () => {
        await assertFails(
            setDoc(doc(seekerDb(), 'users', SEEKER), { isVerified: true }, { merge: true })
        );
    });

    it('ADMIN CAN set isVerified', async () => {
        await assertSucceeds(
            setDoc(doc(adminDb(), 'users', SEEKER), { isVerified: true }, { merge: true })
        );
        const snap = await assertSucceeds(getDoc(doc(seekerDb(), 'users', SEEKER)));
        expect(snap.data()?.isVerified).toBe(true);
    });

    // ── Reports ────────────────────────────────────────────────────
    it('user CANNOT spoof another reporter identity', async () => {
        await assertFails(
            addDoc(collection(seekerDb(), 'reports'), {
                reporterId: OWNER, targetId: ATTACKER, reason: 'spam', status: 'pending',
            })
        );
    });

    it('authenticated user CANNOT read reports; ADMIN CAN', async () => {
        await assertFails(getDoc(doc(seekerDb(), 'reports', 'some-report')));
        await assertSucceeds(getDoc(doc(adminDb(), 'reports', 'some-report')));
    });

    // ── Suspended / banned enforcement ─────────────────────────────
    it('BANNED user CANNOT create a listing', async () => {
        await assertFails(
            addDoc(collection(bannedDb(), 'listings'), {
                title: 'Sneaky Room', ownerId: 'banned-1', city: 'Chennai', status: 'active',
            })
        );
    });

    // ── Chat ───────────────────────────────────────────────────────
    it('non-participant CANNOT read a chat room', async () => {
        await seedDisabled(async (db) => {
            await setDoc(doc(db, 'chatRooms', 'room-x'), { participants: [SEEKER, OWNER] });
        });
        await assertFails(getDoc(doc(attackerDb(), 'chatRooms', 'room-x')));
        await assertSucceeds(getDoc(doc(seekerDb(), 'chatRooms', 'room-x')));
    });

    // ── Owner Verification Security Gate ───────────────────────────
    describe('Owner Verification Security Gate Rules', () => {
        it('Owner CAN submit identity verification (SUBMITTED status)', async () => {
            await assertSucceeds(
                setDoc(doc(ownerDb(), 'ownerVerifications', OWNER), {
                    userId: OWNER,
                    status: 'SUBMITTED',
                    documentType: 'AADHAAR',
                    documentUrl: 'https://storage.googleapis.com/test-bucket/aadhaar.png',
                    declaredName: 'Test Owner',
                    submittedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    resubmissionCount: 0,
                })
            );
        });

        it('Owner CANNOT self-approve verification (status=APPROVED)', async () => {
            await assertFails(
                setDoc(doc(ownerDb(), 'ownerVerifications', OWNER), {
                    userId: OWNER,
                    status: 'APPROVED',
                    documentType: 'AADHAAR',
                    documentUrl: 'https://storage.googleapis.com/test-bucket/aadhaar.png',
                    declaredName: 'Test Owner',
                })
            );
        });

        it('Admin CAN approve owner verification (status=APPROVED)', async () => {
            await assertSucceeds(
                setDoc(doc(adminDb(), 'ownerVerifications', OWNER), {
                    status: 'APPROVED',
                    reviewedBy: 'seed-admin',
                    reviewedAt: serverTimestamp(),
                }, { merge: true })
            );
        });

        it('Owner CANNOT create a listing with status=active', async () => {
            await assertFails(
                addDoc(collection(ownerDb(), 'listings'), {
                    title: 'Bypass Room',
                    ownerId: OWNER,
                    city: 'Chennai',
                    status: 'active',
                    ownerVerified: false,
                })
            );
        });

        it('Owner CANNOT create a listing with ownerVerified=true', async () => {
            await assertFails(
                addDoc(collection(ownerDb(), 'listings'), {
                    title: 'Bypass Room 2',
                    ownerId: OWNER,
                    city: 'Chennai',
                    status: 'pending_verification',
                    ownerVerified: true,
                })
            );
        });

        it('Owner CAN create a listing with status=pending_verification and ownerVerified=false', async () => {
            await assertSucceeds(
                addDoc(collection(ownerDb(), 'listings'), {
                    title: 'Legitimate Pending Room',
                    ownerId: OWNER,
                    city: 'Chennai',
                    status: 'pending_verification',
                    ownerVerified: false,
                })
            );
        });

        it('Owner CANNOT activate an unverified listing via updateDoc', async () => {
            const ref = await seedDisabled(async (db) => {
                return await addDoc(collection(db, 'listings'), {
                    title: 'Unverified Room',
                    ownerId: OWNER,
                    city: 'Chennai',
                    status: 'pending_verification',
                    ownerVerified: false,
                });
            });
            await assertFails(
                updateDoc(doc(ownerDb(), 'listings', (ref as any).id), {
                    status: 'active',
                })
            );
        });

        it('Admin CAN activate an unverified listing and set ownerVerified=true', async () => {
            const ref = await seedDisabled(async (db) => {
                return await addDoc(collection(db, 'listings'), {
                    title: 'Admin Unlocked Room',
                    ownerId: OWNER,
                    city: 'Chennai',
                    status: 'pending_verification',
                    ownerVerified: false,
                });
            });
            await assertSucceeds(
                updateDoc(doc(adminDb(), 'listings', (ref as any).id), {
                    status: 'active',
                    ownerVerified: true,
                })
            );
        });
    });
});