export interface Player {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'player';
  skill: 'Advanced' | 'Intermediate' | 'Beginner';
  balance: number; // positive = credit (owed money back), negative = owes group
  totalGames: number;
  joinedDate: string;
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
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  playerId: string;
  playerName: string;
  amount: number;
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
