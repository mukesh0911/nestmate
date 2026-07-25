import { useState } from 'react';
import { doc, setDoc, addDoc, collection, Timestamp, getDocs, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const SEED_TAG = 'seed_user_';

// Realistic Indian names
const femaleNames = ['Priya Sharma', 'Ananya Reddy', 'Sneha Iyer', 'Kavita Nair', 'Divya Patel', 'Ritu Gupta', 'Pooja Menon', 'Swati Verma', 'Meera Krishnan', 'Isha Joshi'];
const maleNames = ['Aarav Kumar', 'Rohan Singh', 'Arjun Desai', 'Sai Patel', 'Karan Sharma', 'Rahul Reddy', 'Vikram Iyer', 'Amit Nair', 'Suresh Menon', 'Deepak Gupta'];

// Properly keyed quiz answers matching staticData.ts question IDs
const getRealisticQuiz = (type: 'morning' | 'night' | 'balanced') => {
  const profiles = {
    morning: {
      sleep_time: '10_to_12', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'wfo', pets: 'ok', roommate_gender: 'any'
    },
    night: {
      sleep_time: 'after_12', wake_time: '8_to_10', food_pref: 'non_veg',
      smoking: 'outside', drinking: 'occasionally', guests: 'sometimes',
      cleanliness: 'somewhat', work_mode: 'wfh', pets: 'love', roommate_gender: 'any'
    },
    balanced: {
      sleep_time: '10_to_12', wake_time: '6_to_8', food_pref: 'no_pref',
      smoking: 'never', drinking: 'socially', guests: 'sometimes',
      cleanliness: 'somewhat', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any'
    }
  };
  return profiles[type];
};

const professions = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Designer', 'Consultant', 'Doctor', 'Student', 'Marketing Professional'];

const cityLocalities: Record<string, string[]> = {
  Bengaluru: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'BTM Layout', 'Electronic City'],
  Hyderabad: ['Hitech City', 'Gachibowli', 'Kondapur', 'Madhapur', 'Banjara Hills'],
  Chennai: ['Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'T. Nagar'],
  Pune: ['Koregaon Park', 'Hinjewadi', 'Kalyani Nagar', 'Viman Nagar'],
};

const unsplashApartments = [
  'https://images.unsplash.com/photo-1502672260266-1c1de24248ce?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80',
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&q=80',
];

export default function SeedData() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { user, refreshProfile } = useAuth();

  const log = (msg: string) => setLogs(p => [...p, msg]);
  const clearLogs = () => setLogs([]);

  // ── CLEAR ALL SEED DATA ─────────────────────────────────────────────────────
  const handleClear = async () => {
    if (!user) { log('❌ Must be logged in.'); return; }
    if (!window.confirm('Delete ALL seed data? Real user accounts will NOT be affected.')) return;

    setClearing(true);
    clearLogs();
    log('🗑️ Clearing seed data...\n');

    const collections = ['users', 'listings', 'connections', 'chatRooms', 'notifications', 'listingViews'];
    let totalDeleted = 0;

    try {
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        const batch = writeBatch(db);
        let count = 0;
        for (const d of snap.docs) {
          const data = d.data();
          // Delete seed users and their dependent data
          if (
            col === 'users' && (data.uid?.startsWith(SEED_TAG) || data.email?.endsWith('@nestmate-seed.com')) ||
            col === 'listings' && data.ownerId?.startsWith(SEED_TAG) ||
            col === 'connections' && (data.fromUserId?.startsWith(SEED_TAG) || data.toUserId?.startsWith(SEED_TAG)) ||
            col === 'chatRooms' && data.participants?.some((p: string) => p.startsWith(SEED_TAG)) ||
            col === 'notifications' && data.userId?.startsWith(SEED_TAG) ||
            col === 'listingViews'
          ) {
            batch.delete(d.ref);
            count++;
          }
        }
        if (count > 0) {
          await batch.commit();
          totalDeleted += count;
          log(`  ✓ Deleted ${count} documents from ${col}`);
        }
      }
      log(`\n✅ Cleared ${totalDeleted} seed documents. Demo account untouched.`);
    } catch (err: any) {
      log(`\n❌ Error: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  // ── SEED REALISTIC DATA ─────────────────────────────────────────────────────
  const handleSeed = async () => {
    if (!user) { log('❌ Must be logged in.'); return; }
    setLoading(true);
    clearLogs();
    log('🌱 Seeding 20 realistic NestMate profiles...\n');

    try {
      const allCities = Object.keys(cityLocalities);
      const ownerIds: string[] = [];
      const seekerIds: string[] = [];

      // ── Fix demo user (inject proper quiz answers) ──────────────────────────
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), {
          quizAnswers: getRealisticQuiz('balanced'),
          city: 'Bengaluru',
          localities: ['Koramangala', 'HSR Layout'],
          budget: 12000,
          moveInDate: '2026-08-01',
          role: 'seeker',
          onboardingComplete: true,
          name: 'Test User',
          profession: 'Software Engineer',
          age: 26,
          gender: 'Male',
          bio: 'Full-stack developer at a Bengaluru startup. Looking for a chill, clean flatmate in Koramangala or HSR.',
        });
        await refreshProfile(user.uid);
        log(`✓ Demo account (${user.email}) synced with realistic data`);
      } catch (e) {
        log(`⚠️ Could not update demo account — continuing anyway`);
      }

      // ── Create 12 SEEKERS ────────────────────────────────────────────────────
      log('\n👥 Creating 12 Seekers...');
      for (let i = 0; i < 12; i++) {
        const isFemale = i % 3 !== 0;
        const name = isFemale ? femaleNames[i % femaleNames.length] : maleNames[Math.floor(i / 3) % maleNames.length];
        const uid = `${SEED_TAG}seeker_${i}`;
        const city = allCities[i % allCities.length];
        const localities = cityLocalities[city];
        const quizType = i % 3 === 0 ? 'morning' : i % 3 === 1 ? 'night' : 'balanced';
        const budget = [7000, 8500, 10000, 12000, 15000][i % 5];

        await setDoc(doc(db, 'users', uid), {
          uid,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@nestmate-seed.com`,
          role: 'seeker',
          age: 22 + (i % 10),
          gender: isFemale ? 'female' : 'male',
          profession: professions[i % professions.length],
          city,
          localities: [localities[i % localities.length], localities[(i + 1) % localities.length]],
          budget,
          moveInDate: '2026-08-01',
          avatar: `https://i.pravatar.cc/150?u=${uid}`,
          bio: `Hi! I'm a ${professions[i % professions.length]} in ${city}. Looking for a compatible flatmate who values ${quizType === 'morning' ? 'early mornings and clean spaces' : quizType === 'night' ? 'late nights and work-from-home culture' : 'a balanced, flexible lifestyle'}.`,
          quizAnswers: getRealisticQuiz(quizType),
          onboardingComplete: true,
          isPremium: i % 5 === 0,
          isVerified: i % 4 === 0,
          workEmailVerified: i % 3 === 0,
          connectsUsed: 0,
          savedProfileIds: [],
          savedRoomIds: [],
          skippedUserIds: [],
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 20 * 86400000)),
          lastActiveAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 86400000)),
        });
        seekerIds.push(uid);
        log(`  ✓ Seeker: ${name} | ${city} | ₹${budget.toLocaleString()}/mo | ${quizType}`);
      }

      // ── Create 8 OWNERS ──────────────────────────────────────────────────────
      log('\n🏠 Creating 8 Owners...');
      for (let i = 0; i < 8; i++) {
        const isFemale = i % 2 === 0;
        const name = isFemale ? femaleNames[(i + 5) % femaleNames.length] : maleNames[(i + 5) % maleNames.length];
        const uid = `${SEED_TAG}owner_${i}`;
        const city = allCities[i % allCities.length];
        const quizType = i % 3 === 0 ? 'morning' : i % 3 === 1 ? 'night' : 'balanced';

        await setDoc(doc(db, 'users', uid), {
          uid,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@nestmate-seed.com`,
          role: 'owner',
          age: 25 + (i % 8),
          gender: isFemale ? 'female' : 'male',
          profession: professions[(i + 3) % professions.length],
          city,
          localities: [cityLocalities[city][i % cityLocalities[city].length]],
          budget: 0,
          avatar: `https://i.pravatar.cc/150?u=${uid}`,
          bio: `Room owner in ${city}. Verified professional. Looking for a responsible, clean flatmate.`,
          quizAnswers: getRealisticQuiz(quizType),
          onboardingComplete: true,
          isPremium: i % 3 === 0,
          isVerified: i % 2 === 0,
          workEmailVerified: i % 2 === 1,
          connectsUsed: 0,
          savedProfileIds: [],
          savedRoomIds: [],
          skippedUserIds: [],
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 86400000)),
          lastActiveAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 3 * 86400000)),
        });
        ownerIds.push(uid);
        log(`  ✓ Owner: ${name} | ${city} | ${quizType}`);
      }

      // ── Create 8 Listings ───────────────────────────────────────────────────
      log('\n📸 Creating 8 Premium Listings...');
      const listingIds: string[] = [];

      const flatTitles = [
        '2BHK with stunning city view, near Metro',
        'Spacious 1BHK, fully furnished, pet-friendly',
        'Modern 3BHK, rooftop access, co-living vibe',
        'Cozy Studio with dedicated WFH setup',
        'Premium 2BHK in gated community with pool',
        'Bright 1BHK, 5 min walk to IT park',
        'Luxury 3BHK penthouse, all amenities',
        'Affordable 2BHK, great neighbors, near restaurants',
      ];

      for (let i = 0; i < 8; i++) {
        const ownerId = ownerIds[i];
        const ownerData = await (await import('firebase/firestore')).getDoc(doc(db, 'users', ownerId));
        const city = ownerData.exists() ? ownerData.data().city : 'Bengaluru';
        const localList = cityLocalities[city] || cityLocalities['Bengaluru'];
        const locality = localList[i % localList.length];
        const rent = [16000, 18000, 22000, 12000, 25000, 14000, 32000, 19000][i];
        const flatType = ['2BHK', '1BHK', '3BHK', 'Studio', '2BHK', '1BHK', '3BHK', '2BHK'][i];

        const lRef = await addDoc(collection(db, 'listings'), {
          ownerId,
          title: flatTitles[i],
          description: `${flatTitles[i]}. Located in the heart of ${locality}, ${city}. Walking distance from cafes, gyms, and metro. Excellent ventilation, 24/7 security, and power backup. Ideal for working professionals or students. Rent includes maintenance.`,
          locality,
          city,
          address: `${100 + i * 15}, ${locality} Main Road, ${city}`,
          totalRent: rent,
          partnerShare: Math.floor(rent / 2),
          deposit: rent * 2,
          availableFrom: '2026-08-01',
          flatType,
          furnishing: 'Fully Furnished',
          amenities: ['WiFi', 'AC', 'TV', 'Washing Machine', 'Fridge', 'Geyser', 'Parking'].slice(0, 4 + (i % 4)),
          images: [
            unsplashApartments[i % unsplashApartments.length],
            unsplashApartments[(i + 1) % unsplashApartments.length],
            unsplashApartments[(i + 2) % unsplashApartments.length],
          ],
          houseRules: ['No smoking indoors', 'Cleanliness expected', i % 2 === 0 ? 'Veg kitchen preferred' : 'Non-veg allowed'],
          preferredGender: ['Any', 'Female Only', 'Male Only', 'Any'][i % 4],
          status: 'active',
          views: 40 + i * 13,
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 15 * 86400000)),
          updatedAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 86400000)),
        });
        listingIds.push(lRef.id);
        log(`  ✓ ${flatType} in ${locality}, ${city} — ₹${rent.toLocaleString()}/mo`);
      }

      // ── Create 5 Connections + 2 with Chat History ──────────────────────────
      log('\n🔗 Creating Connections & Chat History...');
      const connData = [
        { from: user.uid, to: ownerIds[0], status: 'pending' },
        { from: seekerIds[0], to: ownerIds[1], status: 'accepted', chat: true },
        { from: seekerIds[1], to: ownerIds[2], status: 'accepted', chat: true },
        { from: seekerIds[2], to: ownerIds[3], status: 'pending' },
        { from: seekerIds[3], to: ownerIds[4], status: 'rejected' },
      ];

      const chatMessages = [
        ['Hi! I saw your listing. Is the room still available?', 'Yes, it is! Would you like to schedule a visit?', 'Absolutely! How about this weekend?', 'Saturday works for me. See you at 11 AM!'],
        ['Hello! Your profile looks great. I think we would be compatible.', 'Thank you! I checked yours too and I agree. Are you comfortable with an early morning schedule?', 'Totally! I wake up at 6 AM myself.', 'Perfect. Let us schedule a call to discuss more?'],
      ];

      for (let i = 0; i < connData.length; i++) {
        const c = connData[i];
        const connRef = await addDoc(collection(db, 'connections'), {
          fromUserId: c.from,
          toUserId: c.to,
          status: c.status,
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 10 * 86400000)),
          updatedAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 86400000)),
        });

        if (c.chat) {
          const chatIdx = i - 1;
          const msgs = chatMessages[chatIdx] || chatMessages[0];
          const roomRef = await addDoc(collection(db, 'chatRooms'), {
            participants: [c.from, c.to],
            connectionId: connRef.id,
            lastMessage: msgs[msgs.length - 1],
            lastMessageAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 60 * 60000)),
            lastMessageSenderId: c.from,
            createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 86400000)),
            updatedAt: Timestamp.now(),
          });
          for (let m = 0; m < msgs.length; m++) {
            await addDoc(collection(db, 'chatRooms', roomRef.id, 'messages'), {
              senderId: m % 2 === 0 ? c.from : c.to,
              content: msgs[m],
              read: true,
              createdAt: Timestamp.fromDate(new Date(Date.now() - (msgs.length - m) * 3600000)),
            });
          }
          log(`  ✓ Chat created with ${msgs.length} messages`);
        }
      }

      // ── Notifications for demo user ─────────────────────────────────────────
      log('\n🔔 Creating notifications for demo account...');
      const notifData = [
        { type: 'connect', title: 'New connection request!', description: `${maleNames[0]} wants to connect with you.` },
        { type: 'match', title: '94% compatibility match!', description: `${femaleNames[1]} is highly compatible with you.` },
        { type: 'connect', title: 'Profile viewed', description: `${femaleNames[2]} viewed your profile.` },
      ];
      for (const n of notifData) {
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          ...n,
          read: false,
          actionUrl: '/dashboard',
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 2 * 86400000)),
        });
      }

      // ── View analytics ──────────────────────────────────────────────────────
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        await setDoc(doc(db, 'listingViews', `${listingIds[0]}_${dayStr}`), {
          listingId: listingIds[0],
          date: dayStr,
          count: 15 + Math.floor(Math.random() * 30),
        });
      }

      log('\n🎉 Done! 20 realistic profiles created. Open the dashboard to see your matches!');
    } catch (err: any) {
      log(`\n❌ ERROR: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display italic text-ink mb-1">🌱 NestMate Dev Tools</h1>
          <p className="text-ink/60">Manage seed data for development and testing.</p>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Dev Only — Never run in production</p>
            <p className="text-xs text-amber-700 mt-1">This tool manages fake seed data. Your real account (test@nestmate.com) is always preserved.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Clear Button */}
          <div className="card-nestmate p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">Clear Seed Data</h3>
            </div>
            <p className="text-xs text-ink/60 mb-4">Removes all seed_user_* documents from Firestore. Your demo account stays intact.</p>
            <button
              onClick={handleClear}
              disabled={clearing || loading || !user}
              className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {clearing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Clearing...</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Clear All Seed Data</>
              )}
            </button>
          </div>

          {/* Seed Button */}
          <div className="card-nestmate p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-fire" />
              <h3 className="font-semibold">Seed Realistic Data</h3>
            </div>
            <p className="text-xs text-ink/60 mb-4">Creates 12 seekers + 8 owners with proper quiz answers, 8 listings, connections & chat history.</p>
            <button
              onClick={handleSeed}
              disabled={loading || clearing || !user}
              className="w-full py-2.5 bg-fire text-white rounded-xl text-sm font-semibold hover:bg-fire-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Seeding...</>
              ) : (
                <><Zap className="w-4 h-4" /> Seed 20 Profiles</>
              )}
            </button>
          </div>
        </div>

        {!user && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            ⚠️ You must be logged in to use dev tools.
          </div>
        )}

        {/* Log Terminal */}
        <div className="bg-[#0d1117] rounded-xl p-5 h-80 overflow-y-auto border border-gray-800 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">Awaiting command...</p>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={`mb-0.5 leading-relaxed ${
                l.startsWith('✅') || l.startsWith('🎉') || l.startsWith('✓') ? 'text-green-400' :
                l.startsWith('❌') ? 'text-red-400' :
                l.startsWith('⚠️') ? 'text-yellow-400' :
                l.startsWith('🗑') || l.startsWith('🌱') || l.startsWith('👥') || l.startsWith('🏠') || l.startsWith('🔗') || l.startsWith('🔔') ? 'text-blue-400' :
                'text-gray-300'
              }`}>{l}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
