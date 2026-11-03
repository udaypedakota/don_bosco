const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
// Use reliable public DNS to prevent Windows SRV query ECONNREFUSED (Only on local Windows)
if (!process.env.VERCEL && process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) { }
}

require('dotenv').config();
const {
  sendPaymentReceiptEmail,
  sendPaymentRejectedEmail,
  sendPaymentClaimSubmittedEmail,
  sendAdminPaymentClaimNotification
} = require('./emailService');
const webpush = require('web-push');

// Web Push Notification Setup (VAPID)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BHDCaC5ncvVC_rr8XwAL9YTG8oc79YXlAVPpOfyDWhAaFoxLSeVZZphYR6SiK5BEJl89dC_xwUIz2nASBzJo8zI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '3oLx8MAPj2fkLhE-GupsPeSvQqE7SjSfTDY2YfhJpjg';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'phanidher12@gmail.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      `mailto:${ADMIN_EMAIL}`,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('[WebPush] VAPID configured successfully');
  } catch (err) {
    console.error('[WebPush] VAPID config error:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// MongoDB Atlas URI from .env
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ramukorla3_db_user:Uday8329@badmintiondatabase.vizmqp0.mongodb.net/smashclub?retryWrites=true&w=majority';

let mongoClient = null;
let mongoDb = null;
let isConnected = false;
let lastConnectionError = null;

const EMAIL_DIRECTORY = {
  'p-phani': 'phanidher12@gmail.com',
  'p-admin': 'phanidher12@gmail.com',
  'phani': 'phanidher12@gmail.com',
  '8801147452': 'phanidher12@gmail.com',
  'p-uday': 'udaypedakota@gmail.com',
  'uday': 'udaypedakota@gmail.com',
  '9908660573': 'udaypedakota@gmail.com',
  'p-rajesh': 'avidirajesh14@gmail.com',
  'rajesh': 'avidirajesh14@gmail.com',
  '9603253282': 'avidirajesh14@gmail.com',
  'p-srinvas': 'srinivasc611@gmail.com',
  'srinvas': 'srinivasc611@gmail.com',
  '7013045526': 'srinivasc611@gmail.com',
  'p-nani': 'nanimamidi1712@gmail.com',
  'nani': 'nanimamidi1712@gmail.com',
  '7036349848': 'nanimamidi1712@gmail.com',
  'p-siva': 'ysivakumar@intellectinfo.com',
  'siva': 'ysivakumar@intellectinfo.com',
  '8790859546': 'ysivakumar@intellectinfo.com',
  'aravind': 'aravindgundu7@gmail.com',
  'arvind': 'aravindgundu7@gmail.com',
  'p-1793615778779': 'aravindgundu7@gmail.com',
  '9464783847': 'aravindgundu7@gmail.com'
};

function getPlayerEmail(player, playerId, playerName) {
  if (player && player.email && player.email.trim()) {
    return player.email.trim();
  }
  const byId = playerId ? EMAIL_DIRECTORY[playerId.toLowerCase()] : null;
  if (byId) return byId;
  const byName = playerName ? EMAIL_DIRECTORY[playerName.toLowerCase()] : null;
  if (byName) return byName;
  return null;
}
const DEFAULT_PLAYERS = [
  { id: 'p-phani', name: 'Phani', phone: '8801147452', role: 'admin', email: 'phanidher12@gmail.com', password: 'phani@1998', upiId: '8801147452@ybl', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-siva', name: 'Siva', phone: '8790859546', role: 'player', email: 'ysivakumar@intellectinfo.com', password: 'siva@123', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-uday', name: 'Uday', phone: '9908660573', role: 'player', email: 'udaypedakota@gmail.com', password: 'uday@123', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-nani', name: 'Nani', phone: '7036349848', role: 'player', email: 'nanimamidi1712@gmail.com', password: 'nani@123', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-rajesh', name: 'Rajesh', phone: '9603253282', role: 'player', email: 'avidirajesh14@gmail.com', password: 'rajesh@123', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-srinvas', name: 'Srinvas', phone: '7013045526', role: 'player', email: 'srinivasc611@gmail.com', password: 'srinvas@123', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-1793615778779', name: 'Aravind', phone: '9464783847', role: 'player', email: 'aravindgundu7@gmail.com', password: 'aravind@123', balance: -206, totalGames: 1, createdAt: '2026-11-02T10:36:18.779Z' }
];

const ALL_MEMBERS = ['p-phani', 'p-siva', 'p-uday', 'p-nani', 'p-rajesh', 'p-srinvas'];

// 9 Real Games directly from User's Excel Screenshot
const SCREENSHOT_GAMES = [
  {
    id: 'g-2026-09-19',
    date: '2026-09-19',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 1208,
    shuttleCost: 0,
    totalExpense: 1208,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 201.33,
    status: 'paid',
    notes: 'Court ₹1208 split among 6 players - Settled',
    createdAt: new Date('2026-09-19T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-09-22',
    date: '2026-09-22',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 1208,
    shuttleCost: 0,
    totalExpense: 1208,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 201.33,
    status: 'paid',
    notes: 'Court ₹1208 split among 6 players - Settled',
    createdAt: new Date('2026-09-22T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-09-24',
    date: '2026-09-24',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 623,
    shuttleCost: 0,
    totalExpense: 623,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 103.83,
    status: 'paid',
    notes: 'Court ₹623 split among 6 players - Settled',
    createdAt: new Date('2026-09-24T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-05',
    date: '2026-10-05',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 1208,
    shuttleCost: 0,
    totalExpense: 1208,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 201.33,
    status: 'unpaid',
    notes: 'Court ₹1208 split among 6 players',
    createdAt: new Date('2026-10-05T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-09',
    date: '2026-10-09',
    venue: 'AG Sports Club (Miyapur)',
    courtRent: 2023,
    shuttleCost: 0,
    totalExpense: 2023,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 337.17,
    status: 'unpaid',
    notes: 'Court ₹2023 split among 6 players',
    createdAt: new Date('2026-10-09T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-15',
    date: '2026-10-15',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 1208,
    shuttleCost: 0,
    totalExpense: 1208,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 201.33,
    status: 'unpaid',
    notes: 'Court ₹1208 split among 6 players',
    createdAt: new Date('2026-10-15T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-19',
    date: '2026-10-19',
    venue: 'AG Sports Club (Miyapur)',
    courtRent: 747,
    shuttleCost: 0,
    totalExpense: 747,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 124.50,
    status: 'unpaid',
    notes: 'Court ₹747 split among 6 players',
    createdAt: new Date('2026-10-19T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-26',
    date: '2026-10-26',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 747,
    shuttleCost: 0,
    totalExpense: 747,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 124.50,
    status: 'unpaid',
    notes: 'Court ₹747 split among 6 players',
    createdAt: new Date('2026-10-26T10:00:00Z').toISOString()
  },
  {
    id: 'g-2026-10-28',
    date: '2026-10-28',
    venue: 'Donbosco (Moti Nagar)',
    courtRent: 1208,
    shuttleCost: 0,
    totalExpense: 1208,
    paidByPlayerId: 'p-phani',
    paidByPlayerName: 'Phani',
    splitType: 'equal',
    attendees: ALL_MEMBERS,
    perPlayerShare: 151.00,
    status: 'unpaid',
    notes: 'Court ₹1208 (Share ₹151 per player)',
    createdAt: new Date('2026-10-28T10:00:00Z').toISOString()
  }
];

// Local persistent JSON storage fallback
const LOCAL_DB_FILE = path.join(__dirname, 'local_db.json');

function loadLocalDb() {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    } catch (e) { }
  }
  const defaultDb = {
    players: DEFAULT_PLAYERS,
    games: [],
    payments: [],
    subscriptions: []
  };
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(defaultDb, null, 2));
  return defaultDb;
}

function saveLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving local db:', err.message);
  }
}

let localStore = loadLocalDb();
if (!localStore.subscriptions) localStore.subscriptions = [];

// Helper function to send Web Push Notifications
async function sendPushNotification(query, payload) {
  try {
    let subs = [];
    if (mongoDb) {
      subs = await mongoDb.collection('subscriptions').find(query).toArray();
    } else {
      subs = (localStore.subscriptions || []).filter(s => {
        for (const k in query) {
          if (s[k] !== query[k]) return false;
        }
        return true;
      });
    }

    if (!subs || subs.length === 0) {
      console.log('[WebPush] No matching subscriptions for query:', JSON.stringify(query));
      return { sent: 0, total: 0 };
    }

    const payloadStr = JSON.stringify({
      title: payload.title || '🏸 Smash Club',
      body: payload.body || '',
      icon: payload.icon || '/assets/badminton-app-icon.png',
      badge: '/assets/badminton-app-icon.png',
      tag: payload.tag || 'smash-alert-' + Date.now(),
      url: payload.url || '/'
    });

    const seenEndpoints = new Set();
    const pushOptions = {
      TTL: 86400,
      urgency: 'high',
      headers: {
        'Urgency': 'high'
      }
    };
    let sentCount = 0;
    for (const subRecord of subs) {
      const sub = subRecord.subscription || subRecord;
      if (!sub || !sub.endpoint || seenEndpoints.has(sub.endpoint)) continue;
      seenEndpoints.add(sub.endpoint);
      try {
        await webpush.sendNotification(sub, payloadStr, pushOptions);
        sentCount++;
      } catch (err) {
        console.error('[WebPush] Error delivering to endpoint:', sub.endpoint?.slice(0, 35), err.statusCode || err.message);
        // Remove dead / unsubscribed endpoints
        if (err.statusCode === 404 || err.statusCode === 410) {
          if (mongoDb) {
            await mongoDb.collection('subscriptions').deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          } else if (localStore.subscriptions) {
            localStore.subscriptions = localStore.subscriptions.filter(s => s.endpoint !== sub.endpoint);
            saveLocalDb(localStore);
          }
        }
      }
    }
    console.log(`[WebPush] Successfully delivered ${sentCount}/${subs.length} alerts`);
    return { sent: sentCount, total: subs.length };
  } catch (err) {
    console.error('[WebPush] Dispatch error:', err.message);
    return { sent: 0, error: err.message };
  }
}

let connectingPromise = null;

// Attempt connecting to MongoDB Atlas directly
async function connectAtlas(uri) {
  if (mongoDb && isConnected) {
    return true;
  }
  if (connectingPromise) {
    return connectingPromise;
  }
  connectingPromise = (async () => {
    if (!uri || uri.includes('<db_password>')) {
      console.log('[MongoDB Atlas] Awaiting database password in .env to connect to badmintiondatabase cluster.');
      return false;
    }
    try {
      console.log('[MongoDB Atlas] Connecting to badmintiondatabase.vizmqp0.mongodb.net...');
      if (mongoClient) {
        await mongoClient.close().catch(() => { });
      }
      mongoClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 6000,
        serverSelectionTimeoutMS: 6000,
        maxPoolSize: 10
      });
      await mongoClient.connect();
      await mongoClient.db('admin').command({ ping: 1 });
      mongoDb = mongoClient.db('smashclub');
      isConnected = true;
      console.log('[MongoDB Atlas] SUCCESS! Connected live to badmintiondatabase cloud database.');

      // Ensure all 3 collections (players, games, payments) exist in Atlas
      const existingCollections = await mongoDb.listCollections().toArray();
      const existingNames = existingCollections.map(c => c.name);

      if (!existingNames.includes('players')) {
        await mongoDb.createCollection('players');
      }
      if (!existingNames.includes('games')) {
        await mongoDb.createCollection('games');
        console.log('[MongoDB Atlas] Created games collection in Atlas.');
      }
      if (!existingNames.includes('payments')) {
        await mongoDb.createCollection('payments');
        console.log('[MongoDB Atlas] Created payments collection in Atlas.');
      }

      // Sync screenshot games and accurate balances to MongoDB Atlas
      const gamesCol = mongoDb.collection('games');
      const playersCol = mongoDb.collection('players');
      const paymentsCol = mongoDb.collection('payments');

      // Update legacy "Smash Arena" venues in MongoDB Atlas to Donbosco (Moti Nagar)
      await gamesCol.updateMany(
        { venue: { $regex: /Smash Arena/i } },
        { $set: { venue: 'Donbosco (Moti Nagar)' } }
      ).catch(() => {});

      const count = await gamesCol.countDocuments();

      if (count < 9) {
        console.log('[MongoDB Atlas] Syncing all 9 real games from Excel into Atlas...');
        await gamesCol.deleteMany({});
        await gamesCol.insertMany(SCREENSHOT_GAMES);

        // Seed completed payments for 3 paid games (19-Sep, 22-Sep, 24-Sep)
        await paymentsCol.deleteMany({});
        const paidDates = [
          { date: '2026-09-19', share: 201.33 },
          { date: '2026-09-22', share: 201.33 },
          { date: '2026-09-24', share: 103.83 }
        ];
        const otherPlayers = [
          { id: 'p-siva', name: 'Siva' },
          { id: 'p-uday', name: 'Uday' },
          { id: 'p-nani', name: 'Nani' },
          { id: 'p-rajesh', name: 'Rajesh' },
          { id: 'p-srinvas', name: 'Srinvas' }
        ];

        const initialPayments = [];
        for (const item of paidDates) {
          for (const p of otherPlayers) {
            initialPayments.push({
              id: `pay-${item.date}-${p.id}`,
              date: item.date,
              playerId: p.id,
              playerName: p.name,
              amount: item.share,
              mode: 'UPI',
              utr: `UPI/${item.date.replace(/-/g, '')}/${p.name.slice(0, 3).toUpperCase()}`,
              status: 'completed',
              notes: `Paid and settled for court on ${item.date}`,
              createdAt: new Date(`${item.date}T18:00:00Z`).toISOString()
            });
          }
        }
        await paymentsCol.insertMany(initialPayments);

        // Total unpaid due per player = 201.33 + 337.17 + 201.33 + 124.50 + 124.50 + 151.00 = 1139.83
        const totalDuePerPlayer = 1139.83;
        const totalPhaniReceivable = 5 * totalDuePerPlayer; // 5699.15

        await playersCol.deleteMany({});
        const realPlayers = [
          { id: 'p-phani', name: 'Phani', phone: '8801147452', role: 'admin', password: 'phani@1998', balance: totalPhaniReceivable, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
          { id: 'p-siva', name: 'Siva', phone: '8790859546', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
          { id: 'p-uday', name: 'Uday', phone: '9908660573', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
          { id: 'p-nani', name: 'Nani', phone: '7036349848', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
          { id: 'p-rajesh', name: 'Rajesh', phone: '9603253282', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
          { id: 'p-srinvas', name: 'Srinvas', phone: '7013045526', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() }
        ];
        await playersCol.insertMany(realPlayers);
        console.log('[MongoDB Atlas] ALL 9 REAL GAMES, PAYMENTS & BALANCES SYNCED LIVE TO ATLAS!');
      }
      return true;
    } catch (err) {
      console.error('[MongoDB Atlas] Connection failed:', err.message);
      lastConnectionError = err.message;
      isConnected = false;
      mongoDb = null;
      return false;
    } finally {
      connectingPromise = null;
    }
  })();
  return connectingPromise;
}

// Auto-connect on startup
connectAtlas(MONGODB_URI);

// Middleware to ensure Atlas connection & normalize path for Vercel Serverless
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectAtlas(MONGODB_URI);
    } catch (e) { }
  }
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Status Endpoint
app.get('/api/status', async (req, res) => {
  let stats = {
    players: localStore.players.length,
    games: localStore.games.length,
    payments: localStore.payments.length
  };

  if (mongoDb) {
    try {
      stats.players = await mongoDb.collection('players').countDocuments();
      stats.games = await mongoDb.collection('games').countDocuments();
      stats.payments = await mongoDb.collection('payments').countDocuments();
    } catch (e) { }
  }

  res.json({
    connected: isConnected,
    database: isConnected ? 'badmintiondatabase (smashclub)' : 'Local File Storage (Pending Atlas Password)',
    stats,
    mode: isConnected ? 'MongoDB Atlas Cloud' : 'Local Storage Mode',
    error: isConnected ? null : lastConnectionError
  });
});

// Configure MongoDB Atlas Password directly
app.post('/api/set-password', async (req, res) => {
  const { password } = req.body;
  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const encodedPassword = encodeURIComponent(password.trim());
  const uri = `mongodb+srv://ramukorla3_db_user:${encodedPassword}@badmintiondatabase.vizmqp0.mongodb.net/smashclub?retryWrites=true&w=majority`;

  const success = await connectAtlas(uri);
  if (success) {
    fs.writeFileSync(path.join(__dirname, '.env'), `MONGODB_URI=${uri}\nPORT=${PORT}\n`);
    return res.json({ success: true, message: 'Connected to MongoDB Atlas!' });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Connection failed. Verify your password in MongoDB Atlas and ensure Network Access allows 0.0.0.0/0.'
    });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES (Admin & Player Logins)
// ============================================================================

// Admin / Player Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Name or Phone number is required' });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  let user = null;

  if (mongoDb) {
    user = await mongoDb.collection('players').findOne({
      $or: [
        { phone: identifier.trim() },
        { name: { $regex: new RegExp(`^${cleanIdent}$`, 'i') } }
      ]
    });
  } else {
    user = localStore.players.find(p =>
      p.phone === identifier.trim() || p.name.toLowerCase() === cleanIdent
    );
  }

  if (!user) {
    return res.status(404).json({ error: 'Player not found. Please ask Admin to add your name.' });
  }

  // Admin validation
  if (role === 'admin' && user.role !== 'admin') {
    return res.status(403).json({ error: 'This account does not have Admin access. Please login as Player.' });
  }

  // Password validation
  if (role === 'admin') {
    if (!password || (user.password && user.password !== password)) {
      return res.status(401).json({ error: 'Incorrect admin password' });
    }
  } else {
    const defaultGenPassword = `${user.name.trim().toLowerCase().replace(/\s+/g, '')}@123`;
    const isAravindAlias = user.name.toLowerCase().includes('aravind') || user.name.toLowerCase().includes('arvind');
    const isPasswordValid = 
      !user.password ||
      user.password === password ||
      defaultGenPassword === password ||
      (isAravindAlias && (password === 'aravind@123' || password === 'arvind@123'));

    if (password && !isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance || 0
    }
  });
});

// ============================================================================
// PLAYERS ROUTES (100% Dynamic - Add, List, Delete)
// ============================================================================

// GET /api/players
app.get('/api/players', async (req, res) => {
  let list = [];
  if (mongoDb) {
    try {
      list = await mongoDb.collection('players').find({}).toArray();
    } catch (err) {
      console.error(err);
      list = localStore.players;
    }
  } else {
    list = localStore.players;
  }
  // Sanitize admin password so it is never exposed publicly over the network
  const sanitized = list.map(p => {
    if (p.role === 'admin' || (p.name && p.name.toLowerCase() === 'phani')) {
      const copy = { ...p };
      delete copy.password;
      return copy;
    }
    return p;
  });
  res.json(sanitized);
});

// POST /api/players (Add new player dynamically)
app.post('/api/players', async (req, res) => {
  const { name, phone, role, password, email } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
  }

  // Check duplicate
  if (mongoDb) {
    const existing = await mongoDb.collection('players').findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ error: 'A player with this phone number already exists' });
    }
  } else {
    const existing = localStore.players.find(p => p.phone === cleanPhone);
    if (existing) {
      return res.status(400).json({ error: 'A player with this phone number already exists' });
    }
  }

  const newPlayer = {
    id: 'p-' + Date.now(),
    name: name.trim(),
    phone: cleanPhone,
    role: role === 'admin' ? 'admin' : 'player',
    email: email ? email.trim().toLowerCase() : '',
    password: password || `${name.trim().toLowerCase().replace(/\s+/g, '')}@123`,
    balance: 0,
    totalGames: 0,
    createdAt: new Date().toISOString()
  };

  if (mongoDb) {
    await mongoDb.collection('players').insertOne(newPlayer);
  } else {
    localStore.players.push(newPlayer);
    saveLocalDb(localStore);
  }

  res.status(201).json(newPlayer);
});

// DELETE /api/players/:id
app.delete('/api/players/:id', async (req, res) => {
  const { id } = req.params;
  if (mongoDb) {
    await mongoDb.collection('players').deleteOne({ id });
  } else {
    localStore.players = localStore.players.filter(p => p.id !== id);
    saveLocalDb(localStore);
  }
  res.json({ success: true, message: 'Player removed' });
});

// PUT /api/players/:id (Update Profile Details & Avatar)
app.put('/api/players/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, avatar, skill, hand, upiId, password, email } = req.body;

  const updates = {};
  if (name && name.trim()) updates.name = name.trim();
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) updates.phone = cleanPhone;
  }
  if (avatar !== undefined) updates.avatar = avatar;
  if (skill) updates.skill = skill;
  if (hand) updates.hand = hand;
  if (upiId !== undefined) updates.upiId = upiId.trim();
  if (password) updates.password = password;
  if (email !== undefined) updates.email = (email || '').trim().toLowerCase();

  try {
    if (mongoDb) {
      const filter = {
        $or: [
          { id: id },
          { phone: updates.phone || '' },
          { name: { $regex: new RegExp(`^${name}$`, 'i') } }
        ]
      };
      await mongoDb.collection('players').updateOne(filter, { $set: updates });
      const updated = await mongoDb.collection('players').findOne(filter);
      return res.json(updated || { id, ...updates });
    } else {
      const p = localStore.players.find(pl => pl.id === id || pl.phone === updates.phone);
      if (!p) return res.status(404).json({ error: 'Player not found' });
      Object.assign(p, updates);
      saveLocalDb(localStore);
      return res.json(p);
    }
  } catch (err) {
    console.error('Update player error:', err.message);
    return res.status(500).json({ error: 'Failed to update player: ' + err.message });
  }
});

// ============================================================================
// GAMES ROUTES (Dynamic for Today, Tomorrow, or Any Custom Date)
// ============================================================================

// GET /api/games
app.get('/api/games', async (req, res) => {
  if (mongoDb) {
    try {
      const games = await mongoDb.collection('games').find({}).sort({ date: -1, createdAt: -1 }).toArray();
      return res.json(games);
    } catch (err) {
      console.error(err);
    }
  }
  res.json(localStore.games);
});

// POST /api/games (Record Game for Today, Tomorrow, etc.)
app.post('/api/games', async (req, res) => {
  const { venue, date, courtRent, shuttleCost, attendees, paidByPlayerId, notes } = req.body;
  const cRent = parseFloat(courtRent) || 0;
  const sCost = parseFloat(shuttleCost) || 0;
  const total = cRent + sCost;

  if (!attendees || attendees.length === 0) {
    return res.status(400).json({ error: 'Select at least one attendee' });
  }

  const share = Math.round(total / attendees.length);

  // Find payer name
  let payerName = 'Phani';
  if (mongoDb) {
    const payer = await mongoDb.collection('players').findOne({ id: paidByPlayerId });
    if (payer) payerName = payer.name;
  } else {
    const payer = localStore.players.find(p => p.id === paidByPlayerId);
    if (payer) payerName = payer.name;
  }

  const newGame = {
    id: 'g-' + Date.now(),
    date: date || new Date().toISOString().split('T')[0],
    venue: venue || 'Donbosco (Moti Nagar)',
    courtRent: cRent,
    shuttleCost: sCost,
    totalExpense: total,
    paidByPlayerId: paidByPlayerId || 'p-admin',
    paidByPlayerName: payerName,
    attendees: attendees,
    perPlayerShare: share,
    notes: notes || `Court ₹${cRent} split among ${attendees.length} players`,
    createdAt: new Date().toISOString()
  };

  if (mongoDb) {
    await mongoDb.collection('games').insertOne(newGame);
    // Payer paid total upfront -> balance increases by total
    await mongoDb.collection('players').updateOne({ id: newGame.paidByPlayerId }, { $inc: { balance: total } });
    // Attendees each owe their share -> balance decreases by share, totalGames increments
    for (const pId of attendees) {
      await mongoDb.collection('players').updateOne({ id: pId }, { $inc: { balance: -share, totalGames: 1 } });
    }
  } else {
    localStore.games.unshift(newGame);
    // Update local store balances
    const payer = localStore.players.find(p => p.id === newGame.paidByPlayerId);
    if (payer) payer.balance += total;
    attendees.forEach(pId => {
      const p = localStore.players.find(pl => pl.id === pId);
      if (p) {
        p.balance -= share;
        p.totalGames = (p.totalGames || 0) + 1;
      }
    });
    saveLocalDb(localStore);
  }

  // Send instant push notification to attendees
  for (const pId of attendees) {
    if (pId !== newGame.paidByPlayerId) {
      sendPushNotification({ playerId: pId }, {
        title: '🏸 New Game Added!',
        body: `${payerName} booked ${newGame.venue} on ${newGame.date}. Your share: ₹${share}.`,
        tag: `game-${newGame.id}`,
        url: '/?tab=player'
      }).catch(() => {});
    }
  }

  res.status(201).json(newGame);
});

// ============================================================================
// PAYMENTS ROUTES (Settle dues, record cash or UPI)
// ============================================================================

// GET /api/payments
app.get('/api/payments', async (req, res) => {
  if (mongoDb) {
    try {
      const payments = await mongoDb.collection('payments').find({}).sort({ date: -1 }).toArray();
      return res.json(payments);
    } catch (err) {
      console.error(err);
    }
  }
  res.json(localStore.payments);
});

// POST /api/payments (Admin records direct payment)
app.post('/api/payments', async (req, res) => {
  const { playerId, amount, mode, utr, notes, gameId } = req.body;
  const payAmt = Math.round(parseFloat(amount));
  if (!playerId || !payAmt || payAmt <= 0) {
    return res.status(400).json({ error: 'Valid player and amount are required' });
  }

  let playerName = 'Player';
  let playerEmail = req.body.email || null;
  if (mongoDb) {
    const p = await mongoDb.collection('players').findOne({ id: playerId });
    if (p) {
      playerName = p.name;
      if (!playerEmail) playerEmail = getPlayerEmail(p, playerId, playerName);
    }
  } else {
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) {
      playerName = p.name;
      if (!playerEmail) playerEmail = getPlayerEmail(p, playerId, playerName);
    }
  }
  if (!playerEmail) playerEmail = getPlayerEmail(null, playerId, playerName);

  const payment = {
    id: 'pay-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    playerId,
    playerName,
    gameId: gameId || null,
    amount: payAmt,
    mode: mode || 'UPI',
    utr: utr || `UPI/${Date.now().toString().slice(-6)}`,
    status: 'completed',
    notes: notes || 'Direct settlement payment',
    createdAt: new Date().toISOString()
  };

  if (mongoDb) {
    await mongoDb.collection('payments').insertOne(payment);
    await mongoDb.collection('players').updateOne({ id: playerId }, { $inc: { balance: payAmt } });
  } else {
    localStore.payments.unshift(payment);
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) p.balance += payAmt;
    saveLocalDb(localStore);
  }

  // Send payment receipt email
  await sendPaymentReceiptEmail({
    toEmail: playerEmail,
    playerName,
    amount: payAmt,
    mode: payment.mode,
    utr: payment.utr,
    date: payment.date,
    status: 'completed',
    notes: payment.notes
  }).catch(e => console.error('[Email Trigger Error]', e.message));

  res.status(201).json(payment);
});

// POST /api/payments/claim (Player reports they paid via UPI)
app.post('/api/payments/claim', async (req, res) => {
  const { playerId, amount, utr, mode, gameId, notes } = req.body;
  const payAmt = Math.round(parseFloat(amount));
  if (!playerId || !payAmt || payAmt <= 0) {
    return res.status(400).json({ error: 'Valid player and amount are required' });
  }

  let playerName = 'Player';
  let playerEmail = req.body.email || null;
  if (mongoDb) {
    const p = await mongoDb.collection('players').findOne({ id: playerId });
    if (p) {
      playerName = p.name;
      if (!playerEmail) playerEmail = getPlayerEmail(p, playerId, playerName);
    }
  } else {
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) {
      playerName = p.name;
      if (!playerEmail) playerEmail = getPlayerEmail(p, playerId, playerName);
    }
  }
  if (!playerEmail) playerEmail = getPlayerEmail(null, playerId, playerName);

  // Prevent multiple duplicate submissions if already pending
  if (mongoDb) {
    const existingPending = await mongoDb.collection('payments').findOne({
      playerId,
      status: 'pending',
      amount: payAmt
    });
    if (existingPending) {
      return res.status(200).json(existingPending);
    }
  }

  const paymentClaim = {
    id: 'pay-claim-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    playerId,
    playerName,
    gameId: gameId || null,
    amount: payAmt,
    mode: mode || 'UPI',
    utr: utr || `UPI-CLAIM-${Date.now().toString().slice(-6)}`,
    status: 'pending', // Stored as PENDING - requires Admin Phani approval in the app!
    notes: notes || `Player reported payment of ₹${payAmt} via UPI. Awaiting Admin verification.`,
    createdAt: new Date().toISOString()
  };

  if (mongoDb) {
    await mongoDb.collection('payments').insertOne(paymentClaim);
  } else {
    localStore.payments.unshift(paymentClaim);
    saveLocalDb(localStore);
  }

  // Send admin notification email & player confirmation email + Instant Web Push to Admin
  await Promise.allSettled([
    sendAdminPaymentClaimNotification({
      playerName,
      amount: payAmt,
      mode: paymentClaim.mode,
      utr: paymentClaim.utr,
      date: paymentClaim.date,
      notes: paymentClaim.notes
    }),
    playerEmail ? sendPaymentClaimSubmittedEmail({
      toEmail: playerEmail,
      playerName,
      amount: payAmt,
      mode: paymentClaim.mode,
      utr: paymentClaim.utr,
      date: paymentClaim.date
    }) : Promise.resolve(),
    // Instant Web Push to Admin (Phani's Phone)
    sendPushNotification({ role: 'admin' }, {
      title: '🏸 Payment Claim Received!',
      body: `${playerName} reported UPI payment of ₹${payAmt}. Tap to review & approve.`,
      tag: `claim-${paymentClaim.id}`,
      url: '/?tab=admin'
    })
  ]);

  res.status(201).json(paymentClaim);
});

// POST /api/payments/revert-game (Admin unmarks accidental payment for a game)
app.post('/api/payments/revert-game', async (req, res) => {
  const { gameId, playerId } = req.body;
  if (!gameId || !playerId) {
    return res.status(400).json({ error: 'gameId and playerId are required' });
  }

  let totalReverted = 0;
  if (mongoDb) {
    const payments = await mongoDb.collection('payments').find({
      gameId,
      playerId,
      status: 'completed'
    }).toArray();

    if (payments.length === 0) {
      return res.status(404).json({ error: 'No completed payments found for this game and player' });
    }

    for (const p of payments) {
      totalReverted += p.amount;
    }

    await mongoDb.collection('payments').deleteMany({
      gameId,
      playerId,
      status: 'completed'
    });

    // Deduct the reverted amount from the player's balance
    await mongoDb.collection('players').updateOne(
      { id: playerId },
      { $inc: { balance: -totalReverted } }
    );
  } else {
    const toRemove = localStore.payments.filter(p => p.gameId === gameId && p.playerId === playerId && p.status === 'completed');
    toRemove.forEach(p => totalReverted += p.amount);
    localStore.payments = localStore.payments.filter(p => !(p.gameId === gameId && p.playerId === playerId && p.status === 'completed'));
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) p.balance -= totalReverted;
    saveLocalDb(localStore);
  }

  res.json({ success: true, message: `Reverted ₹${totalReverted} for player to Due`, revertedAmount: totalReverted });
});

// POST /api/payments/:id/approve (Admin verifies and settles claim)
app.post('/api/payments/:id/approve', async (req, res) => {
  const paymentId = req.params.id;
  let payment = null;

  if (mongoDb) {
    payment = await mongoDb.collection('payments').findOne({ id: paymentId });
  } else {
    payment = localStore.payments.find(p => p.id === paymentId);
  }

  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  if (payment.status === 'completed') {
    return res.status(400).json({ error: 'Payment is already approved' });
  }

  payment.status = 'completed';

  let playerObj = null;
  if (mongoDb) {
    await mongoDb.collection('payments').updateOne({ id: paymentId }, { $set: { status: 'completed' } });
    await mongoDb.collection('players').updateOne({ id: payment.playerId }, { $inc: { balance: payment.amount } });
    playerObj = await mongoDb.collection('players').findOne({ id: payment.playerId });

    // When Admin approves a Pay All Dues claim, automatically mark all unpaid games as PAID!
    if (!payment.gameId) {
      const initialDates = ['2026-09-19', '2026-09-22', '2026-09-24'];
      const games = await mongoDb.collection('games').find({ attendees: payment.playerId }).toArray();
      const existingPayments = await mongoDb.collection('payments').find({
        playerId: payment.playerId,
        status: 'completed'
      }).toArray();
      const paidGameIds = new Set(existingPayments.map(p => p.gameId).filter(Boolean));

      const unpaidGames = games.filter(g => !initialDates.includes(g.date) && !paidGameIds.has(g.id));
      for (const g of unpaidGames) {
        const gPay = {
          id: `pay-${Date.now()}-${g.id}-${payment.playerId}`,
          date: payment.date,
          playerId: payment.playerId,
          playerName: payment.playerName,
          gameId: g.id,
          amount: Math.round(g.perPlayerShare),
          mode: payment.mode || 'UPI',
          utr: payment.utr,
          status: 'completed',
          notes: `Court share ₹${Math.round(g.perPlayerShare)} for game on ${g.date} (${g.venue}) - Approved by Phani`,
          createdAt: new Date().toISOString()
        };
        await mongoDb.collection('payments').insertOne(gPay);
      }
    }
  } else {
    const p = localStore.players.find(pl => pl.id === payment.playerId);
    if (p) {
      p.balance += payment.amount;
      playerObj = p;
    }
    saveLocalDb(localStore);
  }

  // Dispatch payment receipt to player via Email and Instant Web Push
  const playerEmail = getPlayerEmail(playerObj, payment.playerId, payment.playerName);
  await Promise.allSettled([
    sendPaymentReceiptEmail({
      toEmail: playerEmail,
      playerName: payment.playerName,
      amount: payment.amount,
      mode: payment.mode,
      utr: payment.utr,
      date: payment.date,
      status: 'completed',
      notes: payment.notes
    }),
    sendPushNotification({ playerId: payment.playerId }, {
      title: '✅ Payment Approved & Settled!',
      body: `Phani approved your ₹${payment.amount} UPI payment. All dues marked as settled!`,
      tag: `approved-${payment.id}`,
      url: '/?tab=player'
    })
  ]).catch(e => console.error('[Push/Email Trigger Error]', e.message));

  res.json({ success: true, payment });
});

// POST /api/payments/:id/reject (Admin rejects invalid claim)
app.post('/api/payments/:id/reject', async (req, res) => {
  const paymentId = req.params.id;
  const reason = req.body && req.body.reason ? req.body.reason : 'Payment record could not be verified';
  let payment = null;

  if (mongoDb) {
    payment = await mongoDb.collection('payments').findOne({ id: paymentId });
    await mongoDb.collection('payments').updateOne({ id: paymentId }, { $set: { status: 'rejected' } });
  } else {
    payment = localStore.payments.find(p => p.id === paymentId);
    if (payment) payment.status = 'rejected';
    saveLocalDb(localStore);
  }

  if (payment) {
    let player = null;
    if (mongoDb) {
      player = await mongoDb.collection('players').findOne({ id: payment.playerId });
    } else {
      player = localStore.players.find(p => p.id === payment.playerId);
    }
    const playerEmail = getPlayerEmail(player, payment.playerId, payment.playerName);

    await Promise.allSettled([
      playerEmail ? sendPaymentRejectedEmail({
        toEmail: playerEmail,
        playerName: payment.playerName,
        amount: payment.amount,
        mode: payment.mode,
        utr: payment.utr,
        date: payment.date,
        reason
      }) : Promise.resolve(),
      sendPushNotification({ playerId: payment.playerId }, {
        title: '⚠️ Payment Claim Update',
        body: `Your payment claim for ₹${payment.amount} was not approved: ${reason}`,
        tag: `rejected-${payment.id}`,
        url: '/?tab=player'
      })
    ]).catch(e => console.error('[Push/Email Reject Error]', e.message));
  }

  res.json({ success: true, message: 'Payment claim rejected' });
});

// ============================================================================
// WEB PUSH NOTIFICATIONS ROUTES
// ============================================================================

// GET /api/notifications/vapid-key
app.get('/api/notifications/vapid-key', (req, res) => {
  res.json({
    publicKey: VAPID_PUBLIC_KEY
  });
});

// POST /api/notifications/subscribe (Register browser for lock-screen push alerts)
app.post('/api/notifications/subscribe', async (req, res) => {
  const { subscription, playerId, playerName, role } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid push subscription required' });
  }

  const record = {
    endpoint: subscription.endpoint,
    subscription,
    playerId: playerId || 'anonymous',
    playerName: playerName || 'Player',
    role: role || 'player',
    updatedAt: new Date().toISOString()
  };

  try {
    if (mongoDb) {
      await mongoDb.collection('subscriptions').updateOne(
        { endpoint: subscription.endpoint },
        { $set: record },
        { upsert: true }
      );
    } else {
      localStore.subscriptions = localStore.subscriptions || [];
      const idx = localStore.subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
      if (idx >= 0) {
        localStore.subscriptions[idx] = record;
      } else {
        localStore.subscriptions.push(record);
      }
      saveLocalDb(localStore);
    }

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('[WebPush Subscribe Error]', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// POST /api/notifications/test (Verify alert appears on phone lock screen)
app.post('/api/notifications/test', async (req, res) => {
  const { playerId, role, title, body } = req.body;
  const filter = {};
  if (playerId) filter.playerId = playerId;
  if (role) filter.role = role;

  const result = await sendPushNotification(filter, {
    title: title || '🏸 Smash Club Phone Alert!',
    body: body || 'Test push notification: Phone alerts are working perfectly!',
    tag: 'test-' + Date.now(),
    url: '/'
  });

  res.json({ success: true, result });
});

// POST /api/test-email (Test email dispatch)
app.post('/api/test-email', async (req, res) => {
  const to = req.body.to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!to) {
    return res.status(400).json({ error: 'Please specify "to" in JSON body or set EMAIL_USER in .env' });
  }
  const result = await sendPaymentReceiptEmail({
    toEmail: to,
    playerName: req.body.playerName || 'Test Player',
    amount: req.body.amount || 200,
    mode: 'UPI (PhonePe)',
    utr: 'UPI-TEST-' + Date.now().toString().slice(-6),
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: 'Test email from Don Bosco Smash Club setup'
  });
  res.json(result);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Smash Club Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Smash Club Backend] Database: ${mongoDb ? 'MongoDB Atlas (Connected)' : 'Local File Persistence (Active)'}`);
  });
}

module.exports = app;
