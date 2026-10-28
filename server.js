const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
// Use reliable public DNS to prevent Windows SRV query ECONNREFUSED
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Atlas URI from .env
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ramukorla3_db_user:Uday8329@badmintiondatabase.vizmqp0.mongodb.net/smashclub?retryWrites=true&w=majority';

let mongoClient = null;
let mongoDb = null;
let isConnected = false;

// Initial 6 players cohort
const DEFAULT_PLAYERS = [
  { id: 'p-phani', name: 'Phani', phone: '9848012345', role: 'admin', password: 'admin', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-siva', name: 'Siva', phone: '9848012346', role: 'player', password: '1234', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-uday', name: 'Uday', phone: '9848012347', role: 'player', password: '1234', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-nani', name: 'Nani', phone: '9848012348', role: 'player', password: '1234', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-rajesh', name: 'Rajesh', phone: '9848012349', role: 'player', password: '1234', balance: 0, totalGames: 0, createdAt: new Date().toISOString() },
  { id: 'p-srinvas', name: 'Srinvas', phone: '9848012350', role: 'player', password: '1234', balance: 0, totalGames: 0, createdAt: new Date().toISOString() }
];

const ALL_MEMBERS = ['p-phani', 'p-siva', 'p-uday', 'p-nani', 'p-rajesh', 'p-srinvas'];

// 9 Real Games directly from User's Excel Screenshot
const SCREENSHOT_GAMES = [
  {
    id: 'g-2026-09-19',
    date: '2026-09-19',
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    venue: 'Smash Arena (Badminton)',
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
    } catch (e) {}
  }
  const defaultDb = {
    players: DEFAULT_PLAYERS,
    games: [],
    payments: []
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

// Attempt connecting to MongoDB Atlas directly
async function connectAtlas(uri) {
  if (!uri || uri.includes('<db_password>')) {
    console.log('[MongoDB Atlas] Awaiting database password in .env to connect to badmintiondatabase cluster.');
    return false;
  }
  try {
    console.log('[MongoDB Atlas] Connecting to badmintiondatabase.vizmqp0.mongodb.net...');
    if (mongoClient) {
      await mongoClient.close().catch(() => {});
    }
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      socketTimeoutMS: 15000
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
        { id: 'p-phani', name: 'Phani', phone: '9848012345', role: 'admin', password: 'admin', balance: totalPhaniReceivable, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
        { id: 'p-siva', name: 'Siva', phone: '9848012346', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
        { id: 'p-uday', name: 'Uday', phone: '9848012347', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
        { id: 'p-nani', name: 'Nani', phone: '9848012348', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
        { id: 'p-rajesh', name: 'Rajesh', phone: '9848012349', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() },
        { id: 'p-srinvas', name: 'Srinvas', phone: '9848012350', role: 'player', password: '1234', balance: -totalDuePerPlayer, totalGames: 9, createdAt: new Date('2026-09-15T00:00:00Z').toISOString() }
      ];
      await playersCol.insertMany(realPlayers);
      console.log('[MongoDB Atlas] ALL 9 REAL GAMES, PAYMENTS & BALANCES SYNCED LIVE TO ATLAS!');
    }
    return true;
  } catch (err) {
    console.error('[MongoDB Atlas] Connection failed:', err.message);
    isConnected = false;
    mongoDb = null;
    return false;
  }
}

// Auto-connect on startup
connectAtlas(MONGODB_URI);

// Middleware to ensure Atlas connection & normalize path for Vercel Serverless
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectAtlas(MONGODB_URI);
    } catch (e) {}
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
    } catch (e) {}
  }

  res.json({
    connected: isConnected,
    database: isConnected ? 'badmintiondatabase (smashclub)' : 'Local File Storage (Pending Atlas Password)',
    stats,
    mode: isConnected ? 'MongoDB Atlas Cloud' : 'Local Storage Mode'
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

  // If password provided for admin
  if (user.role === 'admin' && user.password && password && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect admin password' });
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
  if (mongoDb) {
    try {
      const players = await mongoDb.collection('players').find({}).toArray();
      return res.json(players);
    } catch (err) {
      console.error(err);
    }
  }
  res.json(localStore.players);
});

// POST /api/players (Add new player dynamically)
app.post('/api/players', async (req, res) => {
  const { name, phone, role, password } = req.body;
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
    password: password || '1234',
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

  const share = parseFloat((total / attendees.length).toFixed(2));

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
    venue: venue || 'Smash Arena',
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
  const { playerId, amount, mode, utr, notes } = req.body;
  const payAmt = parseFloat(amount);
  if (!playerId || !payAmt || payAmt <= 0) {
    return res.status(400).json({ error: 'Valid player and amount are required' });
  }

  let playerName = 'Player';
  if (mongoDb) {
    const p = await mongoDb.collection('players').findOne({ id: playerId });
    if (p) playerName = p.name;
  } else {
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) playerName = p.name;
  }

  const payment = {
    id: 'pay-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    playerId,
    playerName,
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

  res.status(201).json(payment);
});

// POST /api/payments/claim (Player reports they paid via UPI)
app.post('/api/payments/claim', async (req, res) => {
  const { playerId, amount, utr, mode } = req.body;
  const payAmt = parseFloat(amount);
  if (!playerId || !payAmt || payAmt <= 0) {
    return res.status(400).json({ error: 'Valid player and amount are required' });
  }

  let playerName = 'Player';
  if (mongoDb) {
    const p = await mongoDb.collection('players').findOne({ id: playerId });
    if (p) playerName = p.name;
  } else {
    const p = localStore.players.find(pl => pl.id === playerId);
    if (p) playerName = p.name;
  }

  const paymentClaim = {
    id: 'pay-claim-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    playerId,
    playerName,
    amount: payAmt,
    mode: mode || 'UPI',
    utr: utr || `UPI-CLAIM-${Date.now().toString().slice(-6)}`,
    status: 'pending',
    notes: `Player reported payment of ₹${payAmt} via UPI. Awaiting Admin verification.`,
    createdAt: new Date().toISOString()
  };

  if (mongoDb) {
    await mongoDb.collection('payments').insertOne(paymentClaim);
  } else {
    localStore.payments.unshift(paymentClaim);
    saveLocalDb(localStore);
  }

  res.status(201).json(paymentClaim);
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

  if (mongoDb) {
    await mongoDb.collection('payments').updateOne({ id: paymentId }, { $set: { status: 'completed' } });
    await mongoDb.collection('players').updateOne({ id: payment.playerId }, { $inc: { balance: payment.amount } });
  } else {
    const p = localStore.players.find(pl => pl.id === payment.playerId);
    if (p) p.balance += payment.amount;
    saveLocalDb(localStore);
  }

  res.json({ success: true, payment });
});

// POST /api/payments/:id/reject (Admin rejects invalid claim)
app.post('/api/payments/:id/reject', async (req, res) => {
  const paymentId = req.params.id;
  if (mongoDb) {
    await mongoDb.collection('payments').updateOne({ id: paymentId }, { $set: { status: 'rejected' } });
  } else {
    const pay = localStore.payments.find(p => p.id === paymentId);
    if (pay) pay.status = 'rejected';
    saveLocalDb(localStore);
  }
  res.json({ success: true, message: 'Payment claim rejected' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Smash Club Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Smash Club Backend] Database: ${mongoDb ? 'MongoDB Atlas (Connected)' : 'Local File Persistence (Active)'}`);
  });
}

module.exports = app;
