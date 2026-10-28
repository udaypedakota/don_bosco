export type Role = 'ROLE_ADMIN' | 'ROLE_PLAYER';
export type SplitType = 'EQUAL' | 'CUSTOM_FIXED' | 'CUSTOM_PERCENTAGE';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'PENDING_VERIFICATION' | 'REJECTED';
export type PaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';

export interface UserSession {
  token: string;
  userId: string;
  username: string;
  email: string;
  mobileNumber: string;
  role: Role;
  playerId: string;
  playerName: string;
  avatarUrl: string;
  preferredLanguage: string;
}

export interface Player {
  id: string;
  uniquePlayerId: string;
  name: string;
  mobileNumber: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  active: boolean;
  totalGamesPlayed: number;
  totalExpenseShare: number;
  totalPaid: number;
  outstandingBalance: number;
  accountActivated: boolean;
  notes?: string;
}

export interface ParticipantInfo {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  attended: boolean;
  shareAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
}

export interface Game {
  id: string;
  title: string;
  courtName: string;
  location: string;
  gameDate: string;
  startTime: string;
  endTime: string;
  courtBookingCost: number;
  shuttlecockExpenses: number;
  additionalExpenses: number;
  totalCost: number;
  organizerPlayerId: string;
  organizerName: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  splitType: SplitType;
  financialConfirmed: boolean;
  notes?: string;
  participants: ParticipantInfo[];
  perPlayerEstimatedShare: number;
}

export interface AllocatedShareDetail {
  playerId: string;
  playerName: string;
  shareAmount: number;
  percentage: number;
  previousShareAmount?: number;
  difference?: number;
}

export interface SplitAllocationPreview {
  gameId: string;
  totalExpense: number;
  splitType: SplitType;
  participantCount: number;
  shares: AllocatedShareDetail[];
  totalAllocated: number;
  roundingAdjustment: number;
  reconciled: boolean;
}

export interface Payment {
  id: string;
  paymentReferenceNumber: string;
  gameId?: string;
  expenseId?: string;
  payerPlayerId: string;
  payerPlayerName: string;
  payeePlayerId?: string;
  payeePlayerName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paymentDate: string;
  status: PaymentStatus;
  verifiedByAdmin: boolean;
  notes?: string;
  createdAt: string;
}

export interface SimplifiedDebt {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface PlayerNetBalance {
  playerId: string;
  playerName: string;
  netBalance: number;
  statusText: string;
}

export interface SettlementSummary {
  totalGroupExpenses: number;
  totalPaymentsCollected: number;
  totalOutstandingBalance: number;
  totalUnsettledDebts: number;
  simplifiedDebts: SimplifiedDebt[];
  netBalances: PlayerNetBalance[];
  directDebts: any[];
}

export interface MonthlyExpensePoint {
  month: string;
  totalExpense: number;
  totalPaid: number;
  gamesPlayed: number;
}

export interface CategoryExpensePoint {
  category: string;
  amount: number;
  percentage: number;
}

export interface AdminDashboardStats {
  totalActivePlayers: number;
  totalGamesCount: number;
  upcomingGamesCount: number;
  monthlyExpenses: number;
  paymentsCollected: number;
  outstandingBalance: number;
  monthlyTrends: MonthlyExpensePoint[];
  categoryBreakdown: CategoryExpensePoint[];
}

export interface PlayerDashboardStats {
  playerId: string;
  playerName: string;
  gamesAttended: number;
  totalExpenseShare: number;
  totalPaymentsMade: number;
  outstandingBalance: number;
  upcomingGamesCount: number;
  personalExpenseTrends: MonthlyExpensePoint[];
}

export interface PlayerFinancialStatement {
  playerId: string;
  playerName: string;
  uniquePlayerId: string;
  gamesPlayed: number;
  totalShare: number;
  totalPaid: number;
  outstandingBalance: number;
  status: string;
}
