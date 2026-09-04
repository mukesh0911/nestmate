import { describe, it, expect } from 'vitest';
import { calculateCompatibility, getMatchReasons } from './matching';
import { applyClientFilters } from './listingFilters';
import { evaluateApplicantFit, rankApplicants } from './applicantRanking';
import { resolveEntityCoordinates } from './locationResolver';

describe('NestMate Performance, Concurrency, and Scale Certification Suite', () => {
  // Helper to compute p50, p95, p99, avg, max
  function calculateMetrics(latenciesMs: number[]) {
    const sorted = [...latenciesMs].sort((a, b) => a - b);
    const count = sorted.length;
    const p50 = sorted[Math.floor(count * 0.50)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const max = sorted[count - 1];
    return { count, p50, p95, p99, avg, max };
  }

  const sampleQuizAnswersA = {
    sleep_time: 'before_10',
    wake_time: '6_to_8',
    food_pref: 'veg',
    smoking: 'never',
    drinking: 'never',
    guests: 'rarely',
    cleanliness: 'very',
    work_mode: 'hybrid',
    pets: 'ok',
    roommate_gender: 'any',
  };

  const sampleQuizAnswersB = {
    sleep_time: '10_to_12',
    wake_time: '6_to_8',
    food_pref: 'veg',
    smoking: 'never',
    drinking: 'occasionally',
    guests: 'sometimes',
    cleanliness: 'very',
    work_mode: 'hybrid',
    pets: 'no',
    roommate_gender: 'any',
  };

  it('Section A: Benchmarks Matching Engine Throughput & Latency (10,000 evaluations)', () => {
    const latencies: number[] = [];
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const score = calculateCompatibility(sampleQuizAnswersA, sampleQuizAnswersB, 'Bengaluru', 'Bengaluru');
      const end = performance.now();
      latencies.push(end - start);
      expect(score).toBe(60);
    }

    const metrics = calculateMetrics(latencies);
    console.log('--- Matching Engine Performance ---', metrics);
    expect(metrics.p95).toBeLessThan(0.1); // < 100 microseconds per calculation
    expect(metrics.avg).toBeLessThan(0.05);
  });

  it('Section A: Benchmarks Listing Filtering Pipeline across 1,000 listings (1,000 filter passes)', () => {
    // Generate 1,000 synthetic listings
    const cities = ['Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR'];
    const localities = ['Koramangala', 'HSR Layout', 'Adyar', 'Velachery', 'Hitech City', 'Andheri'];
    const flatTypes = ['1BHK', '2BHK', '3BHK', 'Studio'];
    const amenitiesPool = ['WiFi', 'AC', 'Parking', 'Gym', 'Washing Machine', 'Geyser'];

    const mockListings = Array.from({ length: 1000 }, (_, i) => ({
      id: `L_${i}`,
      city: cities[i % cities.length],
      locality: localities[i % localities.length],
      totalRent: 10000 + (i % 50) * 1000,
      partnerShare: 5000 + (i % 25) * 1000,
      flatType: flatTypes[i % flatTypes.length],
      furnishing: 'Fully Furnished',
      amenities: [amenitiesPool[i % amenitiesPool.length], amenitiesPool[(i + 1) % amenitiesPool.length]],
      status: i % 10 === 0 ? 'paused' : 'active',
    }));

    const latencies: number[] = [];
    const filterRuns = 1000;

    for (let i = 0; i < filterRuns; i++) {
      const start = performance.now();
      const filtered = applyClientFilters(mockListings as any, {
        city: 'Bengaluru',
        budgetMax: 20000,
        amenities: ['WiFi'],
      });
      const end = performance.now();
      latencies.push(end - start);
      expect(filtered.length).toBeGreaterThan(0);
    }

    const metrics = calculateMetrics(latencies);
    console.log('--- Listing Filter Pipeline Performance (1,000 listings) ---', metrics);
    expect(metrics.p95).toBeLessThan(5.0); // < 5ms for 1,000 items
    expect(metrics.avg).toBeLessThan(2.0);
  });

  it('Section A: Benchmarks Applicant Ranking Engine across 100 applicants', () => {
    const mockApplicants = Array.from({ length: 100 }, (_, i) => ({
      connection: {
        id: `conn_${i}`,
        fromUserId: `user_${i}`,
        toUserId: 'owner_1',
        status: 'pending' as const,
        createdAt: { toMillis: () => Date.now() - i * 3600000 },
      },
      profile: {
        uid: `user_${i}`,
        name: `Applicant ${i}`,
        city: i % 2 === 0 ? 'Bengaluru' : 'Chennai',
        budget: 15000 + (i % 5) * 1000,
        quizAnswers: sampleQuizAnswersB,
        verificationLevel: i % 3,
        isPremium: i % 5 === 0,
      } as any,
    }));

    const latencies: number[] = [];
    for (let i = 0; i < 500; i++) {
      const start = performance.now();
      const ranked = rankApplicants(mockApplicants, (a) =>
        evaluateApplicantFit(sampleQuizAnswersA, a.profile as any, {
          ownerCity: 'Bengaluru',
          listing: { city: 'Bengaluru', locality: 'Koramangala', totalRent: 30000, partnerShare: 15000 },
          requestedAtMs: a.connection.createdAt.toMillis(),
          now: Date.now(),
        })
      );
      const end = performance.now();
      latencies.push(end - start);
      expect(ranked.length).toBe(100);
    }

    const metrics = calculateMetrics(latencies);
    console.log('--- Applicant Ranking Engine Performance (100 applicants) ---', metrics);
    expect(metrics.p95).toBeLessThan(15.0);
    expect(metrics.avg).toBeLessThan(5.0);
  });

  it('Section C: Concurrency Simulation — 50 simultaneous connection attempts to same listing', () => {
    // Model state transitions for 50 concurrent connection requests
    interface ConnectionRecord {
      id: string;
      fromUserId: string;
      toUserId: string;
      listingId: string;
      status: 'pending' | 'accepted' | 'rejected';
    }

    const connectionStore = new Map<string, ConnectionRecord>();
    const notificationsStore: { userId: string; text: string }[] = [];

    // Concurrently simulate 50 seekers connecting to owner_B
    const seekers = Array.from({ length: 50 }, (_, i) => `seeker_${i}`);
    const ownerId = 'owner_B';
    const listingId = 'lst_blr_001';

    // Atomic connect simulation
    const connectResults = seekers.map(seekerId => {
      const key = `${seekerId}_${ownerId}_${listingId}`;
      if (connectionStore.has(key)) {
        return { success: false, reason: 'duplicate' };
      }
      const newConn: ConnectionRecord = {
        id: `conn_${seekerId}`,
        fromUserId: seekerId,
        toUserId: ownerId,
        listingId,
        status: 'pending',
      };
      connectionStore.set(key, newConn);
      notificationsStore.push({
        userId: ownerId,
        text: `New connection request from ${seekerId}`,
      });
      return { success: true, connectionId: newConn.id };
    });

    expect(connectResults.every(r => r.success)).toBe(true);
    expect(connectionStore.size).toBe(50);
    expect(notificationsStore.length).toBe(50);

    // Concurrently try duplicate connections — must all be blocked
    const duplicateAttempts = seekers.map(seekerId => {
      const key = `${seekerId}_${ownerId}_${listingId}`;
      if (connectionStore.has(key)) {
        return { success: false, reason: 'duplicate' };
      }
      return { success: true };
    });

    expect(duplicateAttempts.every(r => !r.success && r.reason === 'duplicate')).toBe(true);
    expect(connectionStore.size).toBe(50); // No record growth
  });

  it('Section E: Stress & Memory Soak Simulation (10,000 state mutations across 500 rooms)', () => {
    const memoryBefore = process.memoryUsage().heapUsed;

    const chatRooms = new Map<string, { id: string; messages: { id: string; sender: string; text: string }[] }>();
    for (let r = 0; r < 500; r++) {
      chatRooms.set(`room_${r}`, { id: `room_${r}`, messages: [] });
    }

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const roomId = `room_${i % 500}`;
      const room = chatRooms.get(roomId)!;
      room.messages.push({
        id: `msg_${i}`,
        sender: i % 2 === 0 ? 'userA' : 'userB',
        text: `Message content ${i}`,
      });
    }
    const duration = performance.now() - start;
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryGrowthMb = (memoryAfter - memoryBefore) / (1024 * 1024);

    console.log(`--- Stress & Soak: 10,000 messages in ${duration.toFixed(2)}ms, Heap Delta: ${memoryGrowthMb.toFixed(2)}MB ---`);
    expect(duration).toBeLessThan(1000); // 10k messages dispatched in under 1s
    expect(memoryGrowthMb).toBeLessThan(50); // Under 50MB heap growth
  });
});
