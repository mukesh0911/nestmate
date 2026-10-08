/**
 * NestMate — Firestore Direct Seed Script (REST API — no Admin SDK needed)
 * Usage: node tests/seed/firestore-seed.cjs
 */
const https = require('https');

const PROJECT_ID = 'nestmate-eb562';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const now = new Date();
const nowIso = now.toISOString();
const fresh = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86400000).toISOString();

function strVal(v)      { return { stringValue: String(v) }; }
function intVal(v)      { return { integerValue: String(Math.round(v)) }; }
function boolVal(v)     { return { booleanValue: Boolean(v) }; }
function tsVal(isoStr)  { return { timestampValue: isoStr }; }
function nullVal()      { return { nullValue: 'NULL_VALUE' }; }
function arrVal(items)  { return { arrayValue: { values: items } }; }
function mapVal(fields) { return { mapValue: { fields } }; }

function firestoreRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(FIRESTORE_BASE + urlPath);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(raw || '{}'));
        else reject(new Error(`HTTP ${res.statusCode} ${method} ${urlPath}: ${raw.substring(0, 400)}`));
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function upsert(col, docId, fields) {
  const params = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  await firestoreRequest('PATCH', `/${col}/${docId}?${params}`, { fields });
}

const defaultQuiz = {
  sleep_time: strVal('before_10'), wake_time: strVal('6_to_8'), food_pref: strVal('veg'),
  smoking: strVal('never'), drinking: strVal('never'), guests: strVal('rarely'),
  cleanliness: strVal('very'), work_mode: strVal('hybrid'), pets: strVal('ok'), roommate_gender: strVal('any'),
};

async function seed() {
  console.log('\n====================================================');
  console.log('NESTMATE FIRESTORE SEED — ' + PROJECT_ID);
  console.log('====================================================\n');

  // USERS
  console.log('Writing users...');
  const users = [
    { uid:'test_user_ref',            name:'Aditi Sharma (Reference)', email:'seeker.ref@nestmate-test.com',     role:'seeker', status:'active',    city:'Bengaluru', budget:15000, isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_perfect_match',  name:'Pooja Iyer (100% Match)',  email:'seeker.perfect@nestmate-test.com', role:'seeker', status:'active',    city:'Bengaluru', budget:14500, isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_night_owl',      name:'Karan Mehra (Night Owl)',  email:'seeker.night@nestmate-test.com',   role:'seeker', status:'active',    city:'Bengaluru', budget:16000, isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_quota_full',     name:'Suresh Raina (Quota)',     email:'seeker.quota@nestmate-test.com',   role:'seeker', status:'active',    city:'Bengaluru', budget:12000, isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:5, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_suspended',      name:'Suspended Seeker',         email:'suspended@nestmate-test.com',      role:'seeker', status:'suspended', city:'Bengaluru', budget:10000, isVerified:false, phoneVerified:false, onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_banned',         name:'Banned Seeker',            email:'banned@nestmate-test.com',         role:'seeker', status:'banned',    city:'Bengaluru', budget:10000, isVerified:false, phoneVerified:false, onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:defaultQuiz },
    { uid:'test_user_pro_user',       name:'Priya Sharma (Pro)',       email:'seeker.pro@nestmate-test.com',     role:'seeker', status:'active',    city:'Bengaluru', budget:20000, isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:true,  connectsUsed:0, connectsLimit:999, quiz:defaultQuiz },
    { uid:'test_user_owner_01',       name:'Ramesh Gupta (Owner A)',   email:'owner.verified@nestmate-test.com', role:'owner',  status:'active',    city:'Bengaluru', budget:0,     isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:null },
    { uid:'test_user_owner_02',       name:'Siddharth Rao (Owner B)', email:'owner.unverified@nestmate-test.com',role:'owner', status:'active',    city:'Bengaluru', budget:0,     isVerified:false, phoneVerified:false, onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:null },
    { uid:'test_user_owner_03',       name:'Anjali Deshmukh (Pending)',email:'owner.pending@nestmate-test.com',  role:'owner',  status:'active',    city:'Bengaluru', budget:0,     isVerified:false, phoneVerified:false, onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:null },
    { uid:'test_user_owner_04',       name:'Sunil Verma (Portfolio)', email:'owner.portfolio@nestmate-test.com', role:'owner',  status:'active',    city:'Bengaluru', budget:0,     isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:false, connectsUsed:0, connectsLimit:5,   quiz:null },
    { uid:'test_user_admin',          name:'Administrator',            email:'admin@nestmate-test.com',          role:'admin',  status:'active',    city:'Bengaluru', budget:0,     isVerified:true,  phoneVerified:true,  onboardingComplete:true,  isPremium:true,  connectsUsed:0, connectsLimit:999, quiz:null },
  ];
  for (const u of users) {
    const f = {
      uid:strVal(u.uid), name:strVal(u.name), email:strVal(u.email), role:strVal(u.role),
      status:strVal(u.status), city:strVal(u.city), budget:intVal(u.budget),
      isVerified:boolVal(u.isVerified), phoneVerified:boolVal(u.phoneVerified),
      onboardingComplete:boolVal(u.onboardingComplete), isPremium:boolVal(u.isPremium),
      connectsUsed:intVal(u.connectsUsed), connectsLimit:intVal(u.connectsLimit),
      isTest:boolVal(true), createdAt:tsVal(nowIso), updatedAt:tsVal(nowIso),
      savedRoomIds:arrVal([]), savedProfileIds:arrVal([]),
      ...(u.quiz ? { quizAnswers:mapVal(u.quiz) } : {}),
    };
    await upsert('users', u.uid, f);
    console.log('  user: ' + u.uid);
  }
  await upsert('admins', 'test_user_admin', { email:strVal('admin@nestmate-test.com'), uid:strVal('test_user_admin'), isTest:boolVal(true) });

  // LISTINGS — with proper Timestamp fields so freshness gate passes
  console.log('\nWriting listings...');
  const listings = [
    { id:'test_listing_live_01', ownerId:'test_user_owner_01', title:'Active Prime 2BHK in Koramangala',     status:'active',               ownerVerified:true,  totalRent:26000, partnerShare:13000, deposit:52000, city:'Bengaluru', locality:'Koramangala',    flatType:'2BHK',   lastConfirmedAt:fresh(2),  createdAt:fresh(10), views:45 },
    { id:'test_listing_live_02', ownerId:'test_user_owner_04', title:'Premium 1BHK in Indiranagar',          status:'active',               ownerVerified:true,  totalRent:22000, partnerShare:11000, deposit:44000, city:'Bengaluru', locality:'Indiranagar',    flatType:'1BHK',   lastConfirmedAt:fresh(1),  createdAt:fresh(5),  views:80 },
    { id:'test_listing_live_03', ownerId:'test_user_owner_01', title:'Budget Studio in HSR Layout',           status:'active',               ownerVerified:true,  totalRent:14000, partnerShare:7000,  deposit:28000, city:'Bengaluru', locality:'HSR Layout',     flatType:'studio', lastConfirmedAt:fresh(0),  createdAt:fresh(3),  views:20 },
    { id:'test_listing_pend_01', ownerId:'test_user_owner_02', title:'Pending Verification 1BHK Whitefield', status:'pending_verification', ownerVerified:false, totalRent:18000, partnerShare:9000,  deposit:36000, city:'Bengaluru', locality:'Whitefield',     flatType:'1BHK',   lastConfirmedAt:fresh(0),  createdAt:fresh(1),  views:0  },
    { id:'test_listing_pause_01',ownerId:'test_user_owner_01', title:'Paused 3BHK in Whitefield',             status:'paused',               ownerVerified:true,  totalRent:35000, partnerShare:17500, deposit:70000, city:'Bengaluru', locality:'Whitefield',     flatType:'3BHK',   lastConfirmedAt:fresh(5),  createdAt:fresh(20), views:22 },
    { id:'test_listing_fill_01', ownerId:'test_user_owner_04', title:'Filled Room in BTM Layout',             status:'filled',               ownerVerified:true,  totalRent:12000, partnerShare:6000,  deposit:24000, city:'Bengaluru', locality:'BTM Layout',     flatType:'1BHK',   lastConfirmedAt:fresh(3),  createdAt:fresh(30), views:80 },
    { id:'test_listing_exp_01',  ownerId:'test_user_owner_01', title:'Expired Listing (46 days old)',          status:'active',               ownerVerified:true,  totalRent:22000, partnerShare:11000, deposit:44000, city:'Bengaluru', locality:'Koramangala',    flatType:'2BHK',   lastConfirmedAt:fresh(46), createdAt:fresh(50), views:30 },
  ];
  for (const l of listings) {
    await upsert('listings', l.id, {
      ownerId:strVal(l.ownerId), title:strVal(l.title), description:strVal('Test listing — ' + l.title),
      status:strVal(l.status), ownerVerified:boolVal(l.ownerVerified),
      totalRent:intVal(l.totalRent), partnerShare:intVal(l.partnerShare), deposit:intVal(l.deposit),
      city:strVal(l.city), locality:strVal(l.locality), flatType:strVal(l.flatType),
      furnishing:strVal('semi-furnished'), address:strVal(l.locality + ', Bengaluru'),
      amenities:arrVal([strVal('wifi'), strVal('parking')]), houseRules:arrVal([strVal('no smoking')]),
      images:arrVal([]), availableFrom:tsVal(nowIso),
      partnersNeeded:intVal(1), applicants:intVal(0), views:intVal(l.views),
      lastConfirmedAt:tsVal(l.lastConfirmedAt),
      createdAt:tsVal(l.createdAt), updatedAt:tsVal(fresh(0)),
      isTest:boolVal(true), lat:{doubleValue:12.9716}, lng:{doubleValue:77.5946},
      preferredGender:strVal('any'), ownerName:strVal(''), ownerAvatar:strVal(''),
    });
    console.log('  listing: ' + l.id + ' [' + l.status + '] ownerVerified=' + l.ownerVerified);
  }

  // CONNECTIONS
  console.log('\nWriting connections...');
  const conns = [
    {id:'test_conn_p01', from:'test_user_ref',           to:'test_user_owner_01', listingId:'test_listing_live_01', status:'pending'},
    {id:'test_conn_a01', from:'test_user_perfect_match', to:'test_user_owner_01', listingId:'test_listing_live_01', status:'accepted'},
    {id:'test_conn_r01', from:'test_user_night_owl',     to:'test_user_owner_01', listingId:'test_listing_live_01', status:'rejected'},
    {id:'test_conn_b01', from:'test_user_suspended',     to:'test_user_owner_01', listingId:'test_listing_live_01', status:'blocked'},
  ];
  for (const c of conns) {
    await upsert('connections', c.id, {
      fromUserId:strVal(c.from), toUserId:strVal(c.to), listingId:strVal(c.listingId),
      status:strVal(c.status), isTest:boolVal(true), createdAt:tsVal(nowIso), updatedAt:tsVal(nowIso),
    });
    console.log('  conn: ' + c.id + ' [' + c.status + ']');
  }

  // NOTIFICATIONS
  console.log('\nWriting notifications...');
  const notifs = [
    {id:'test_notif_01', userId:'test_user_owner_01',      type:'connection_request', title:'New Connection Request', message:'Aditi Sharma sent you a connection request.', read:false, link:'/owner-dashboard?tab=applicants'},
    {id:'test_notif_02', userId:'test_user_perfect_match', type:'connection_accepted', title:'Connection Accepted',   message:'Ramesh Gupta accepted your request!',          read:true,  link:'/chat'},
    {id:'test_notif_03', userId:'test_user_owner_01',      type:'new_message',        title:'New Message',            message:'Pooja: Saturday works best.',                   read:false, link:'/chat'},
  ];
  for (const n of notifs) {
    await upsert('notifications', n.id, { userId:strVal(n.userId), type:strVal(n.type), title:strVal(n.title), message:strVal(n.message), read:boolVal(n.read), link:strVal(n.link), isTest:boolVal(true), createdAt:tsVal(nowIso) });
    console.log('  notif: ' + n.id);
  }

  // OWNER VERIFICATIONS
  console.log('\nWriting owner verifications...');
  const verifs = [
    {id:'test_verif_owner_01', userId:'test_user_owner_01',       status:'APPROVED'},
    {id:'test_verif_owner_02', userId:'test_user_owner_02',       status:'SUBMITTED'},
    {id:'test_verif_owner_03', userId:'test_user_owner_03',       status:'UNDER_REVIEW'},
    {id:'test_verif_owner_04', userId:'test_user_owner_04',       status:'RESUBMISSION_REQUIRED'},
    {id:'test_verif_owner_05', userId:'test_user_owner_rejected', status:'REJECTED'},
  ];
  for (const v of verifs) {
    await upsert('ownerVerifications', v.id, { userId:strVal(v.userId), status:strVal(v.status), isTest:boolVal(true), createdAt:tsVal(nowIso), updatedAt:tsVal(nowIso) });
    console.log('  verif: ' + v.id + ' [' + v.status + ']');
  }

  console.log('\n====================================================');
  console.log('FIRESTORE SEED COMPLETE');
  console.log('3 active visible listings written to Bengaluru');
  console.log('Refresh localhost:3000/explore to see listings!');
  console.log('====================================================\n');
}

seed().catch(err => { console.error('SEED FAILED:', err.message); process.exit(1); });
