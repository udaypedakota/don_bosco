import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Player, Game, Payment, SettlementSummary, AdminDashboardStats,
  PlayerDashboardStats, PlayerFinancialStatement, SplitAllocationPreview,
  SplitType, ParticipantInfo
} from '../models/smash.models';

@Injectable({
  providedIn: 'root'
})
export class SmashDataService {
  private apiUrl = environment.apiUrl;

  // Initial Mock Database State (Starts with 7 Players as specified)
  private mockPlayers: Player[] = [
    {
      id: 'player-001',
      uniquePlayerId: 'SC-001',
      name: 'Vikram Rao',
      mobileNumber: '9876543210',
      email: 'vikram.rao@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-01-10',
      active: true,
      totalGamesPlayed: 6,
      totalExpenseShare: 840,
      totalPaid: 840,
      outstandingBalance: 0,
      accountActivated: true,
      notes: 'Organizer & Team Lead'
    },
    {
      id: 'player-002',
      uniquePlayerId: 'SC-002',
      name: 'Ananya Sharma',
      mobileNumber: '9876543211',
      email: 'ananya.sharma@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-01-12',
      active: true,
      totalGamesPlayed: 5,
      totalExpenseShare: 700,
      totalPaid: 700,
      outstandingBalance: 0,
      accountActivated: true,
      notes: 'Smash specialist'
    },
    {
      id: 'player-003',
      uniquePlayerId: 'SC-003',
      name: 'Karthik Reddy',
      mobileNumber: '9876543212',
      email: 'karthik.reddy@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-01-15',
      active: true,
      totalGamesPlayed: 5,
      totalExpenseShare: 700,
      totalPaid: 560,
      outstandingBalance: 140,
      accountActivated: true,
      notes: 'Net play master'
    },
    {
      id: 'player-004',
      uniquePlayerId: 'SC-004',
      name: 'Priya Nair',
      mobileNumber: '9876543213',
      email: 'priya.nair@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-01-20',
      active: true,
      totalGamesPlayed: 4,
      totalExpenseShare: 560,
      totalPaid: 420,
      outstandingBalance: 140,
      accountActivated: true,
      notes: 'Defensive powerhouse'
    },
    {
      id: 'player-005',
      uniquePlayerId: 'SC-005',
      name: 'Rahul Verma',
      mobileNumber: '9876543214',
      email: 'rahul.verma@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-02-01',
      active: true,
      totalGamesPlayed: 4,
      totalExpenseShare: 560,
      totalPaid: 280,
      outstandingBalance: 280,
      accountActivated: true,
      notes: 'Agile singles player'
    },
    {
      id: 'player-006',
      uniquePlayerId: 'SC-006',
      name: 'Sneha Patel',
      mobileNumber: '9876543215',
      email: 'sneha.patel@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-02-05',
      active: true,
      totalGamesPlayed: 3,
      totalExpenseShare: 420,
      totalPaid: 280,
      outstandingBalance: 140,
      accountActivated: true,
      notes: 'Deceptive drops'
    },
    {
      id: 'player-007',
      uniquePlayerId: 'SC-007',
      name: 'Arjun Das',
      mobileNumber: '9876543216',
      email: 'arjun.das@smashclub.in',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      joinDate: '2026-02-10',
      active: true,
      totalGamesPlayed: 3,
      totalExpenseShare: 420,
      totalPaid: 420,
      outstandingBalance: 0,
      accountActivated: true,
      notes: 'Power smash server'
    }
  ];

  // Initial Mock Games (Includes the exact ₹840 6-player session from prompt!)
  private mockGames: Game[] = [
    {
      id: 'game-001',
      title: 'Saturday Morning Smash Battle',
      courtName: 'Star Badminton Arena, Court 3',
      location: 'Gachibowli, Hyderabad',
      gameDate: '2026-10-25',
      startTime: '06:00',
      endTime: '08:00',
      courtBookingCost: 600,
      shuttlecockExpenses: 240,
      additionalExpenses: 0,
      totalCost: 840,
      organizerPlayerId: 'player-001',
      organizerName: 'Vikram Rao',
      status: 'COMPLETED',
      splitType: 'EQUAL',
      financialConfirmed: true,
      notes: 'Organizer Vikram paid ₹840 upfront for 6 players. Each share ₹140.',
      perPlayerEstimatedShare: 140,
      participants: [
        { playerId: 'player-001', playerName: 'Vikram Rao', attended: true, shareAmount: 140, paidAmount: 140, paymentStatus: 'PAID' },
        { playerId: 'player-002', playerName: 'Ananya Sharma', attended: true, shareAmount: 140, paidAmount: 140, paymentStatus: 'PAID' },
        { playerId: 'player-003', playerName: 'Karthik Reddy', attended: true, shareAmount: 140, paidAmount: 100, paymentStatus: 'PARTIALLY_PAID' },
        { playerId: 'player-004', playerName: 'Priya Nair', attended: true, shareAmount: 140, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-005', playerName: 'Rahul Verma', attended: true, shareAmount: 140, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-006', playerName: 'Sneha Patel', attended: true, shareAmount: 140, paidAmount: 0, paymentStatus: 'PENDING' }
      ]
    },
    {
      id: 'game-002',
      title: 'Upcoming Weekend Doubles League',
      courtName: 'Star Badminton Arena, Court 1 & 2',
      location: 'Gachibowli, Hyderabad',
      gameDate: '2026-10-31',
      startTime: '06:30',
      endTime: '08:30',
      courtBookingCost: 1200,
      shuttlecockExpenses: 360,
      additionalExpenses: 80,
      totalCost: 1640,
      organizerPlayerId: 'player-001',
      organizerName: 'Vikram Rao',
      status: 'SCHEDULED',
      splitType: 'EQUAL',
      financialConfirmed: false,
      notes: 'Yonex Aerosensa 50 shuttlecocks provided. 7 players confirmed.',
      perPlayerEstimatedShare: 234.29,
      participants: [
        { playerId: 'player-001', playerName: 'Vikram Rao', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-002', playerName: 'Ananya Sharma', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-003', playerName: 'Karthik Reddy', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-004', playerName: 'Priya Nair', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-005', playerName: 'Rahul Verma', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-006', playerName: 'Sneha Patel', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' },
        { playerId: 'player-007', playerName: 'Arjun Das', attended: true, shareAmount: 234.29, paidAmount: 0, paymentStatus: 'PENDING' }
      ]
    }
  ];

  // Initial Mock Payments
  private mockPayments: Payment[] = [
    {
      id: 'pay-001',
      paymentReferenceNumber: 'PAY-20261025-001',
      gameId: 'game-001',
      payerPlayerId: 'player-002',
      payerPlayerName: 'Ananya Sharma',
      payeePlayerId: 'player-001',
      payeePlayerName: 'Vikram Rao',
      amount: 140,
      paymentMethod: 'UPI',
      transactionReference: 'UPI982736451290',
      paymentDate: '2026-10-25 09:30',
      status: 'PAID',
      verifiedByAdmin: true,
      notes: 'UPI payment to Vikram for Saturday game',
      createdAt: '2026-10-25 09:30'
    },
    {
      id: 'pay-002',
      paymentReferenceNumber: 'PAY-20261025-002',
      gameId: 'game-001',
      payerPlayerId: 'player-003',
      payerPlayerName: 'Karthik Reddy',
      payeePlayerId: 'player-001',
      payeePlayerName: 'Vikram Rao',
      amount: 100,
      paymentMethod: 'CASH',
      transactionReference: 'CASH-REC-01',
      paymentDate: '2026-10-25 08:15',
      status: 'PAID',
      verifiedByAdmin: true,
      notes: 'Partial cash payment on court',
      createdAt: '2026-10-25 08:15'
    }
  ];

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('smash_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // --- Players ---
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/players`, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of([...this.mockPlayers])));
  }

  createPlayer(data: any): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/players`, data, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const newPlayer: Player = {
            id: 'player-' + (this.mockPlayers.length + 1),
            uniquePlayerId: `SC-${String(this.mockPlayers.length + 1).padStart(3, '0')}`,
            name: data.name,
            mobileNumber: data.mobileNumber,
            email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@smashclub.in`,
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            joinDate: new Date().toISOString().split('T')[0],
            active: true,
            totalGamesPlayed: 0,
            totalExpenseShare: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            accountActivated: false,
            notes: data.notes
          };
          this.mockPlayers.push(newPlayer);
          return of(newPlayer);
        })
      );
  }

  deactivatePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/players/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const p = this.mockPlayers.find(x => x.id === id);
          if (p) p.active = false;
          return of({ success: true });
        })
      );
  }

  activatePlayer(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/players/${id}/activate`, {}, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const p = this.mockPlayers.find(x => x.id === id);
          if (p) p.active = true;
          return of({ success: true });
        })
      );
  }

  // --- Games ---
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games`, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of([...this.mockGames])));
  }

  getGameById(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/games/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const g = this.mockGames.find(x => x.id === id) || this.mockGames[0];
          return of(g);
        })
      );
  }

  createGame(data: any): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games`, data, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const total = Number(data.courtBookingCost || 0) + Number(data.shuttlecockExpenses || 0) + Number(data.additionalExpenses || 0);
          const pList: ParticipantInfo[] = (data.participantPlayerIds || []).map((pid: string) => {
            const p = this.mockPlayers.find(x => x.id === pid);
            return {
              playerId: pid,
              playerName: p?.name || 'Player',
              avatarUrl: p?.avatarUrl,
              attended: true,
              shareAmount: data.participantPlayerIds.length > 0 ? +(total / data.participantPlayerIds.length).toFixed(2) : 0,
              paidAmount: 0,
              paymentStatus: 'PENDING' as const
            };
          });

          const newGame: Game = {
            id: 'game-' + (this.mockGames.length + 1),
            title: data.title,
            courtName: data.courtName,
            location: data.location || 'Hyderabad',
            gameDate: data.gameDate,
            startTime: data.startTime || '06:00',
            endTime: data.endTime || '08:00',
            courtBookingCost: Number(data.courtBookingCost || 0),
            shuttlecockExpenses: Number(data.shuttlecockExpenses || 0),
            additionalExpenses: Number(data.additionalExpenses || 0),
            totalCost: total,
            organizerPlayerId: data.organizerPlayerId || 'player-001',
            organizerName: this.mockPlayers.find(p => p.id === data.organizerPlayerId)?.name || 'Vikram Rao',
            status: 'SCHEDULED',
            splitType: data.splitType || 'EQUAL',
            financialConfirmed: false,
            notes: data.notes,
            participants: pList,
            perPlayerEstimatedShare: pList.length > 0 ? +(total / pList.length).toFixed(2) : 0
          };
          this.mockGames.unshift(newGame);
          return of(newGame);
        })
      );
  }

  updateAttendance(gameId: string, attendedIds: string[]): Observable<Game> {
    return this.http.put<Game>(`${this.apiUrl}/games/${gameId}/attendance`, { attendedPlayerIds: attendedIds }, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const g = this.mockGames.find(x => x.id === gameId);
          if (g) {
            g.participants.forEach(p => {
              p.attended = attendedIds.includes(p.playerId);
            });
            const attendedCount = g.participants.filter(p => p.attended).length || 1;
            g.perPlayerEstimatedShare = +(g.totalCost / attendedCount).toFixed(2);
          }
          return of(g!);
        })
      );
  }

  // --- Financial Splits ---
  previewSplit(gameId: string, splitType: SplitType, allocations?: any[]): Observable<SplitAllocationPreview> {
    return this.http.post<SplitAllocationPreview>(`${this.apiUrl}/expenses/preview?gameId=${gameId}&splitType=${splitType}`, allocations || [], { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const g = this.mockGames.find(x => x.id === gameId) || this.mockGames[0];
          const attended = g.participants.filter(p => p.attended);
          const count = attended.length || 1;
          const baseShare = Math.floor((g.totalCost / count) * 100) / 100;
          const remainderCents = Math.round((g.totalCost - (baseShare * count)) * 100);

          const shares = attended.map((p, idx) => {
            const share = idx < remainderCents ? +(baseShare + 0.01).toFixed(2) : baseShare;
            return {
              playerId: p.playerId,
              playerName: p.playerName,
              shareAmount: share,
              percentage: +((share / g.totalCost) * 100).toFixed(2),
              previousShareAmount: p.shareAmount,
              difference: +(share - p.shareAmount).toFixed(2)
            };
          });

          return of({
            gameId,
            totalExpense: g.totalCost,
            splitType,
            participantCount: count,
            shares,
            totalAllocated: g.totalCost,
            roundingAdjustment: 0,
            reconciled: true
          });
        })
      );
  }

  confirmSplit(data: any): Observable<SplitAllocationPreview> {
    return this.http.post<SplitAllocationPreview>(`${this.apiUrl}/expenses/confirm`, data, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const g = this.mockGames.find(x => x.id === data.gameId);
          if (g) {
            g.splitType = data.splitType;
            g.financialConfirmed = true;
            g.status = 'COMPLETED';
          }
          return this.previewSplit(data.gameId, data.splitType, data.allocations);
        })
      );
  }

  // --- Payments ---
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments`, { headers: this.getAuthHeaders() })
      .pipe(catchError(() => of([...this.mockPayments])));
  }

  recordPayment(data: any): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, data, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const payer = this.mockPlayers.find(p => p.id === data.payerPlayerId);
          const payee = this.mockPlayers.find(p => p.id === data.payeePlayerId) || this.mockPlayers[0];
          const newPayment: Payment = {
            id: 'pay-' + (this.mockPayments.length + 1),
            paymentReferenceNumber: `PAY-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
            gameId: data.gameId,
            payerPlayerId: data.payerPlayerId,
            payerPlayerName: payer?.name || 'Player',
            payeePlayerId: payee.id,
            payeePlayerName: payee.name,
            amount: Number(data.amount),
            paymentMethod: data.paymentMethod || 'UPI',
            transactionReference: data.transactionReference || 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000),
            paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'PAID',
            verifiedByAdmin: true,
            notes: data.notes,
            createdAt: new Date().toISOString()
          };
          this.mockPayments.unshift(newPayment);

          if (payer) {
            payer.totalPaid += newPayment.amount;
            payer.outstandingBalance = Math.max(0, payer.outstandingBalance - newPayment.amount);
          }

          return of(newPayment);
        })
      );
  }

  // --- Settlements & Who Owes Whom ---
  getSettlementSummary(): Observable<SettlementSummary> {
    return this.http.get<SettlementSummary>(`${this.apiUrl}/settlements/summary`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          // Calculations from mock data: Vikram (organizer) paid ₹840 for game-001
          // Ananya paid ₹140 (settled)
          // Karthik paid ₹100 (owes ₹40)
          // Priya owes ₹140
          // Rahul owes ₹140
          // Sneha owes ₹140
          // Arjun was not in game-001 (0)
          return of({
            totalGroupExpenses: 840,
            totalPaymentsCollected: 240,
            totalOutstandingBalance: 600,
            totalUnsettledDebts: 4,
            simplifiedDebts: [
              { fromPlayerId: 'player-003', fromPlayerName: 'Karthik Reddy', toPlayerId: 'player-001', toPlayerName: 'Vikram Rao', amount: 40 },
              { fromPlayerId: 'player-004', fromPlayerName: 'Priya Nair', toPlayerId: 'player-001', toPlayerName: 'Vikram Rao', amount: 140 },
              { fromPlayerId: 'player-005', fromPlayerName: 'Rahul Verma', toPlayerId: 'player-001', toPlayerName: 'Vikram Rao', amount: 140 },
              { fromPlayerId: 'player-006', fromPlayerName: 'Sneha Patel', toPlayerId: 'player-001', toPlayerName: 'Vikram Rao', amount: 140 }
            ],
            netBalances: [
              { playerId: 'player-001', playerName: 'Vikram Rao', netBalance: 460, statusText: 'Receives ₹460.00' },
              { playerId: 'player-002', playerName: 'Ananya Sharma', netBalance: 0, statusText: 'Settled (₹0.00)' },
              { playerId: 'player-003', playerName: 'Karthik Reddy', netBalance: -40, statusText: 'Owes ₹40.00' },
              { playerId: 'player-004', playerName: 'Priya Nair', netBalance: -140, statusText: 'Owes ₹140.00' },
              { playerId: 'player-005', playerName: 'Rahul Verma', netBalance: -140, statusText: 'Owes ₹140.00' },
              { playerId: 'player-006', playerName: 'Sneha Patel', netBalance: -140, statusText: 'Owes ₹140.00' },
              { playerId: 'player-007', playerName: 'Arjun Das', netBalance: 0, statusText: 'Settled (₹0.00)' }
            ],
            directDebts: []
          });
        })
      );
  }

  resolveSettlement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/settlements/resolve`, data, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          return this.recordPayment({
            payerPlayerId: data.fromPlayerId,
            payeePlayerId: data.toPlayerId,
            amount: data.amount,
            paymentMethod: data.paymentMethod || 'UPI',
            transactionReference: data.transactionReference,
            notes: 'Settlement resolution: ' + (data.notes || '')
          });
        })
      );
  }

  // --- Reports & Dashboards ---
  getAdminDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.apiUrl}/reports/admin-dashboard`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => of({
          totalActivePlayers: this.mockPlayers.filter(p => p.active).length,
          totalGamesCount: this.mockGames.length,
          upcomingGamesCount: 1,
          monthlyExpenses: 2480,
          paymentsCollected: 1880,
          outstandingBalance: 600,
          monthlyTrends: [
            { month: 'Jun 2026', totalExpense: 1800, totalPaid: 1800, gamesPlayed: 4 },
            { month: 'Jul 2026', totalExpense: 2100, totalPaid: 2100, gamesPlayed: 5 },
            { month: 'Aug 2026', totalExpense: 2300, totalPaid: 2200, gamesPlayed: 5 },
            { month: 'Sep 2026', totalExpense: 2400, totalPaid: 2260, gamesPlayed: 6 },
            { month: 'Oct 2026', totalExpense: 2480, totalPaid: 1880, gamesPlayed: 6 }
          ],
          categoryBreakdown: [
            { category: 'Court Booking', amount: 1800, percentage: 72.5 },
            { category: 'Shuttlecocks', amount: 600, percentage: 24.2 },
            { category: 'Refreshments', amount: 80, percentage: 3.3 }
          ]
        }))
      );
  }

  getPlayerDashboardStats(playerId: string): Observable<PlayerDashboardStats> {
    return this.http.get<PlayerDashboardStats>(`${this.apiUrl}/reports/player-dashboard/${playerId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => {
          const p = this.mockPlayers.find(x => x.id === playerId) || this.mockPlayers[1];
          return of({
            playerId: p.id,
            playerName: p.name,
            gamesAttended: p.totalGamesPlayed,
            totalExpenseShare: p.totalExpenseShare,
            totalPaymentsMade: p.totalPaid,
            outstandingBalance: p.outstandingBalance,
            upcomingGamesCount: 1,
            personalExpenseTrends: [
              { month: 'Jul 2026', totalExpense: 140, totalPaid: 140, gamesPlayed: 1 },
              { month: 'Aug 2026', totalExpense: 140, totalPaid: 140, gamesPlayed: 1 },
              { month: 'Sep 2026', totalExpense: 280, totalPaid: 280, gamesPlayed: 2 },
              { month: 'Oct 2026', totalExpense: 140, totalPaid: 140, gamesPlayed: 1 }
            ]
          });
        })
      );
  }

  getPlayerStatements(): Observable<PlayerFinancialStatement[]> {
    return this.http.get<PlayerFinancialStatement[]>(`${this.apiUrl}/reports/player-statements`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(() => of(
          this.mockPlayers.map(p => ({
            playerId: p.id,
            playerName: p.name,
            uniquePlayerId: p.uniquePlayerId,
            gamesPlayed: p.totalGamesPlayed,
            totalShare: p.totalExpenseShare,
            totalPaid: p.totalPaid,
            outstandingBalance: p.outstandingBalance,
            status: p.outstandingBalance === 0 ? 'Settled' : 'Pending'
          }))
        ))
      );
  }

  downloadCsv(type: 'games' | 'payments' | 'player-statements') {
    // Generate browser download dynamically from current mock/real data
    let csvContent = '';
    let filename = `smash-club-${type}.csv`;

    if (type === 'games') {
      csvContent = 'Game ID,Title,Court Name,Location,Date,Start Time,End Time,Total Cost (INR),Organizer,Status\n' +
        this.mockGames.map(g => `"${g.id}","${g.title}","${g.courtName}","${g.location}","${g.gameDate}","${g.startTime}","${g.endTime}","${g.totalCost}","${g.organizerName}","${g.status}"`).join('\n');
    } else if (type === 'payments') {
      csvContent = 'Payment Ref,Payer Name,Payee Name,Amount (INR),Payment Method,Transaction Reference (UTR),Payment Date,Status\n' +
        this.mockPayments.map(p => `"${p.paymentReferenceNumber}","${p.payerPlayerName}","${p.payeePlayerName}","${p.amount}","${p.paymentMethod}","${p.transactionReference || ''}","${p.paymentDate}","${p.status}"`).join('\n');
    } else {
      csvContent = 'Player ID,Player Name,Games Played,Total Expense Share (INR),Total Paid (INR),Outstanding Balance (INR),Status\n' +
        this.mockPlayers.map(p => `"${p.uniquePlayerId}","${p.name}","${p.totalGamesPlayed}","${p.totalExpenseShare}","${p.totalPaid}","${p.outstandingBalance}","${p.outstandingBalance === 0 ? 'Settled' : 'Pending'}"`).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
