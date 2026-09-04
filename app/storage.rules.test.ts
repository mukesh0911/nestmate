/**
 * Sprint FINAL — Firebase Storage Security Rules emulator tests.
 *
 * Exercises the REAL storage.rules against the Storage Emulator.
 * Covers: unauthenticated access, owner upload, unauthorized upload,
 * private identity-document reads, MIME restrictions, size caps,
 * deletion authorization.
 *
 * Run with:  npm run test:storage-rules   (starts the emulators)
 * Skipped unless RUN_STORAGE_RULES_TESTS=1 so plain `npm test` never
 * requires a running emulator.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    assertSucceeds,
    assertFails,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runStorage = process.env.RUN_STORAGE_RULES_TESTS === '1';
const d = runStorage ? describe : describe.skip;

const PROJECT_ID = 'rules-test-nestmate';
// The Storage emulator derives the default bucket from the projectId.
const BUCKET = `${PROJECT_ID}.appspot.com`;
const RULES_PATH = resolve(__dirname, 'storage.rules');

const ALICE = 'alice-1';
const MALLORY = 'mallory-1';

let env: RulesTestEnvironment;

function aliceStorage() {
    return env.authenticatedContext(ALICE).storage();
}
function malloryStorage() {
    return env.authenticatedContext(MALLORY).storage();
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TEXT_BYTES = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]); // "hello"

d('Firebase Storage security rules (emulator)', () => {
    beforeAll(async () => {
        env = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            storage: { rules: readFileSync(RULES_PATH, 'utf8') },
        });
    });

    afterAll(async () => {
        await env.cleanup();
    });

    // A. Unauthenticated access
    it('UNAUTHENTICATED user CANNOT read a profile image', async () => {
        await assertSucceeds(
            uploadBytes(ref(aliceStorage(), `profiles/${ALICE}/avatar.png`), PNG_BYTES, { contentType: 'image/png' })
        );
        await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), `profiles/${ALICE}/avatar.png`)));
    });

    // B. Legitimate owner upload
    it('owner CAN upload a profile image to their own path', async () => {
        await assertSucceeds(
            uploadBytes(ref(aliceStorage(), `profiles/${ALICE}/avatar2.png`), PNG_BYTES, { contentType: 'image/png' })
        );
    });

    // C. Unauthorized user upload
    it('another user CANNOT upload into someone else profile path', async () => {
        await assertFails(
            uploadBytes(ref(malloryStorage(), `profiles/${ALICE}/evil.png`), PNG_BYTES, { contentType: 'image/png' })
        );
    });

    // D. Owner read of private identity document
    it('owner CAN read their own verification document', async () => {
        await assertSucceeds(
            uploadBytes(ref(aliceStorage(), `verifications/${ALICE}/gov-id.png`), PNG_BYTES, { contentType: 'image/png' })
        );
        await assertSucceeds(getBytes(ref(aliceStorage(), `verifications/${ALICE}/gov-id.png`)));
    });

    // E. Unauthorized read of private identity document
    it('ANOTHER USER CANNOT read a private identity document', async () => {
        await assertFails(getBytes(ref(malloryStorage(), `verifications/${ALICE}/gov-id.png`)));
    });

    it('UNAUTHENTICATED user CANNOT read a private identity document', async () => {
        await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), `verifications/${ALICE}/gov-id.png`)));
    });

    // F. Invalid MIME/type restriction
    it('non-image upload to listings is REJECTED', async () => {
        await assertFails(
            uploadBytes(ref(malloryStorage(), 'listings/listing-1/not-image.txt'), TEXT_BYTES, { contentType: 'text/plain' })
        );
    });

    it('valid image upload to listings by an authenticated user SUCCEEDS', async () => {
        await assertSucceeds(
            uploadBytes(ref(malloryStorage(), 'listings/listing-1/room.png'), PNG_BYTES, { contentType: 'image/png' })
        );
    });

    // G. Oversized file restriction (>10MB cap)
    it('oversized listing image is REJECTED', async () => {
        const big = new Uint8Array(10 * 1024 * 1024 + 1);
        await assertFails(
            uploadBytes(ref(malloryStorage(), 'listings/listing-1/big.png'), big, { contentType: 'image/png' })
        );
    });

    // H/I. Deletion authorization
    it('UNAUTHENTICATED user CANNOT delete a listing image', async () => {
        await assertFails(deleteObject(ref(env.unauthenticatedContext().storage(), 'listings/listing-1/room.png')));
    });

    it('authenticated user CAN delete per the existing listings policy', async () => {
        await assertSucceeds(deleteObject(ref(malloryStorage(), 'listings/listing-1/room.png')));
    });
});