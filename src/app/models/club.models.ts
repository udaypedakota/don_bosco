export interface Player {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'player';
  balance: number; // positive = credit (owed money back), negative = owes group
  totalGames: number;
  email?: string;
  avatar?: string;
  skill?: 'Advanced' | 'Intermediate' | 'Beginner';
  hand?: 'Right-handed' | 'Left-handed';
  upiId?: string;
  password?: string;
  createdAt?: string;
  joinedDate?: string;
}

export interface Game {
  id: string;
  date: string;
  venue: string;
  courtRent: number;
  shuttlesUsed: number;
  shuttleCost: number;
  totalExpense: number;
  paidByPlayerId: string;
  paidByPlayerName: string;
  splitType: 'equal' | 'fixed' | 'percentage';
  attendees: string[]; // player IDs
  perPlayerShare: number;
  status?: 'paid' | 'unpaid';
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  playerId: string;
  playerName: string;
  amount: number;
  gameId?: string;
  mode: 'UPI' | 'Cash' | 'Bank Transfer';
  utr: string;
  status?: 'pending' | 'completed' | 'rejected';
  notes?: string;
}

export interface SettlementTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  upiId: string;
}

export interface AtlasStatus {
  connected: boolean;
  isConnecting?: boolean;
  database: string;
  maskedUri: string;
  stats: {
    players: number;
    games: number;
    payments: number;
  };
  mode: string;
}
