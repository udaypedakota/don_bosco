import { Component, inject, signal, computed, effect, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from './services/club.service';
import { Player, Game, Payment } from './models/club.models';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  clubService = inject(ClubService);

  // Login Celebration State (Shuttlecock & Party Confetti Burst)
  isCelebrationActive = signal<boolean>(false);
  @ViewChild('celebrationCanvas') celebrationCanvasRef?: ElementRef<HTMLCanvasElement>;
  private celebrationAnimId?: number;
  private celebrationTimeouts: any[] = [];

  // Web Push Notification State
  pushPermission = signal<NotificationPermission | 'unsupported'>('default');
  pushLoading = signal<boolean>(false);
  isPushSupported = signal<boolean>(false);

  constructor() {
    // Auto-Restore Session when opening via personalized Push Notification link
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authPlayerId = urlParams.get('authPlayer');
        if (authPlayerId) {
          this.clubService.quickRestore(authPlayerId).subscribe({
            next: (res) => {
              if (res.success && res.user) {
                this.showToast(`🏸 Welcome back, ${res.user.name}!`);
                this.triggerLoginCelebration();
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
              }
            },
            error: (e) => console.log('[QuickRestore Error]', e)
          });
        }
      } catch (e) {
        console.error('[URL Param Check Error]', e);
      }
    }

    // Check Web Push Support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      this.isPushSupported.set(true);
      this.pushPermission.set(Notification.permission);
      if (Notification.permission === 'granted') {
        this.registerPushForUser();
      }
    } else {
      this.pushPermission.set('unsupported');
    }

    effect(() => {
      const user = this.currentUser();
      if (user && this.pushPermission() === 'granted') {
        this.registerPushForUser();
      }
    });

    effect(() => {
      const players = this.clubService.players();
      if (players.length > 0) {
        if (!this.gamePaidBy() || !players.some(p => p.id === this.gamePaidBy())) {
          const phani = players.find(p => p.name.toLowerCase() === 'phani') || 
                        players.find(p => p.role === 'admin') || 
                        players[0];
          this.gamePaidBy.set(phani.id);
        }
        if (this.gameAttendees().length === 0) {
          this.gameAttendees.set(players.map(p => p.id));
        }
      }
    });
  }

  // Login Form State
  loginRole = signal<'admin' | 'player'>('admin');
  loginIdentifier = signal<string>('Phani');
  loginPassword = signal<string>('');
  showPassword = signal<boolean>(false);
  loginError = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  selectQuickPlayer(player: Player): void {
    this.loginIdentifier.set(player.name);
    if (player.role === 'admin' || player.name.toLowerCase() === 'phani') {
      this.loginPassword.set(''); // Keep empty for Phani (Admin) so password remains private
    } else {
      this.loginPassword.set(player.name.toLowerCase() + '@123');
    }
  }

  // Dynamic Add Player Form
  newPlayerName = signal<string>('');
  newPlayerPhone = signal<string>('');
  newPlayerRole = signal<'player' | 'admin'>('player');
  playerFormError = signal<string | null>(null);

  // Dynamic Game Session (Today / Tomorrow / Custom Date)
  gameDate = signal<string>(new Date().toISOString().split('T')[0]);
  gameVenue = signal<string>('Donbosco (Moti Nagar)');
  courtVenues = ['Donbosco (Moti Nagar)', 'AG Sports Club (Miyapur)'];
  gameTimeSlot = signal<string>('08:00 PM – 10:00 PM');
  timeSlotPresets = [
    '06:00 AM – 08:00 AM',
    '07:00 AM – 09:00 AM',
    '06:00 PM – 08:00 PM',
    '08:00 PM – 10:00 PM'
  ];
  gameCourtRent = signal<number>(1200);
  gameShuttleCost = signal<number>(0);
  gamePaidBy = signal<string>('p-phani');
  gameAttendees = signal<string[]>([]);
  gameNotes = signal<string>('');

  // Payment Recording Form
  payPlayerId = signal<string>('');
  payAmount = signal<number>(300);
  payMode = signal<'UPI' | 'Cash'>('UPI');

  // Modals & Panels
  showAddPlayerModal = signal<boolean>(false);
  showPaymentModal = signal<boolean>(false);
  showAtlasModal = signal<boolean>(false);
  showUpiModal = signal<boolean>(false);
  showClaimModal = signal<boolean>(false);
  showInstallModal = signal<boolean>(false);
  installTab = signal<'ios' | 'android'>('ios');
  claimUtr = signal<string>('');
  toastMessage = signal<string | null>(null);

  round(val: any): number {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Math.round(Number(val));
  }

  // Admin Game Filter & Player Breakdown
  adminGameFilter = signal<'all' | 'settled' | 'pending'>('all');
  selectedPlayerForBreakdown = signal<Player | null>(null);
  showBreakdownModal = signal<boolean>(false);

  // Game-by-game Payment Signals
  selectedGameForPayment = signal<Game | null>(null);
  showGamePayModal = signal<boolean>(false);
  gamePayUtr = signal<string>('');

  // Profile Signals & Modal
  showProfileModal = signal<boolean>(false);
  profileName = signal<string>('');
  profilePhone = signal<string>('');
  profileAvatar = signal<string>('');
  profileSkill = signal<'Advanced' | 'Intermediate' | 'Beginner'>('Intermediate');
  profileHand = signal<'Right-handed' | 'Left-handed'>('Right-handed');
  profileUpiId = signal<string>('');
  profilePassword = signal<string>('');
  profileSaving = signal<boolean>(false);
  profileError = signal<string | null>(null);

  avatarPresets = ['🏸', '⚡', '🔥', '👑', '🦅', '🦁', '🌟', '🎯', '🥇', '🚀'];

  // Atlas Password input
  atlasPassword = signal<string>('');
  atlasConnecting = signal<boolean>(false);
  atlasFeedback = signal<{ success: boolean; message: string } | null>(null);

  // Computed Values
  currentUser = computed(() => this.clubService.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  totalGameExpense = computed(() => {
    return (Number(this.gameCourtRent()) || 0) + (Number(this.gameShuttleCost()) || 0);
  });

  perPlayerShare = computed(() => {
    const total = this.totalGameExpense();
    const count = this.gameAttendees().length;
    return count > 0 ? (total / count).toFixed(2) : '0.00';
  });

  // Current logged in player's personal details
  myPlayerRecord = computed(() => {
    const u = this.currentUser();
    if (!u) return null;
    return this.clubService.players().find(p => p.id === u.id || p.phone === u.phone) || null;
  });

  myPendingPayment = computed(() => {
    const u = this.currentUser();
    if (!u) return null;
    return this.clubService.payments().find(p => p.playerId === u.id && p.status === 'pending') || null;
  });

  pendingClaimsCount = computed(() => this.clubService.pendingPayments().length);

  myAttendedGames = computed(() => {
    const u = this.currentUser();
    if (!u) return [];
    return this.clubService.games().filter(g => g.attendees.includes(u.id));
  });

  // Player Portal Expandable Boxes ('all', 'unpaid', 'paid')
  openedBoxes = signal<{ all: boolean; unpaid: boolean; paid: boolean }>({
    all: false,
    unpaid: false,
    paid: false
  });

  togglePlayerBox(box: 'all' | 'unpaid' | 'paid'): void {
    this.openedBoxes.update(s => ({
      ...s,
      [box]: !s[box]
    }));
  }

  isBoxOpen(box: 'all' | 'unpaid' | 'paid'): boolean {
    return this.openedBoxes()[box];
  }

  // Player Portal Interactive Filter Tabs ('attended' | 'unpaid' | 'paid')
  playerSelectedTab = signal<'attended' | 'unpaid' | 'paid'>('attended');

  setPlayerTab(tab: 'attended' | 'unpaid' | 'paid'): void {
    this.playerSelectedTab.set(tab);
  }

  unpaidGamesList = computed(() => {
    return this.myAttendedGames().filter(g => this.getGameStatusForPlayer(g).status === 'unpaid');
  });

  paidGamesList = computed(() => {
    return this.myAttendedGames().filter(g => this.getGameStatusForPlayer(g).status === 'paid');
  });

  playerFilteredGames = computed(() => {
    const tab = this.playerSelectedTab();
    if (tab === 'unpaid') {
      return this.unpaidGamesList();
    }
    if (tab === 'paid') {
      return this.paidGamesList();
    }
    return this.myAttendedGames();
  });

  isGameFullySettled(game: Game): boolean {
    if (['2026-09-19', '2026-09-22', '2026-09-24'].includes(game.date) || game.status === 'paid') {
      return true;
    }
    const otherAttendees = game.attendees.filter(id => id !== game.paidByPlayerId);
    if (otherAttendees.length === 0) return true;
    return otherAttendees.every(id => this.getGameStatusForPlayer(game, id).status === 'paid');
  }

  // Month Filter State & Available Months
  selectedMonthFilter = signal<string>('all');

  availableMonths = computed(() => {
    const games = this.clubService.games();
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const g of games) {
      if (g.date && g.date.length >= 7) {
        const key = g.date.slice(0, 7);
        if (!map.has(key)) {
          const [year, month] = key.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = parseInt(month, 10) - 1;
          const label = `${monthNames[mIdx] || month} ${year}`;
          map.set(key, { key, label, count: 0 });
        }
        map.get(key)!.count++;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  });

  // Admin Expandable Boxes ('all', 'pending', 'settled')
  openedAdminBoxes = signal<{ all: boolean; pending: boolean; settled: boolean }>({
    all: false,
    pending: false,
    settled: false
  });

  toggleAdminBox(box: 'all' | 'pending' | 'settled'): void {
    this.openedAdminBoxes.update(s => ({
      ...s,
      [box]: !s[box]
    }));
  }

  isAdminBoxOpen(box: 'all' | 'pending' | 'settled'): boolean {
    return this.openedAdminBoxes()[box];
  }

  // Admin Game Attendees Toggle per Game ID
  expandedGameAttendees = signal<Record<string, boolean>>({});

  toggleGameAttendees(gameId: string): void {
    this.expandedGameAttendees.update(m => ({
      ...m,
      [gameId]: !m[gameId]
    }));
  }

  isGameAttendeesOpen(gameId: string): boolean {
    return !!this.expandedGameAttendees()[gameId];
  }

  monthAllGames = computed(() => {
    const month = this.selectedMonthFilter();
    let games = this.clubService.games();
    if (month !== 'all') {
      games = games.filter(g => g.date && g.date.startsWith(month));
    }
    return games;
  });

  monthPendingGames = computed(() => {
    return this.monthAllGames().filter(g => !this.isGameFullySettled(g));
  });

  monthSettledGames = computed(() => {
    return this.monthAllGames().filter(g => this.isGameFullySettled(g));
  });

  filteredGames = computed(() => {
    const filter = this.adminGameFilter();
    const month = this.selectedMonthFilter();
    let games = this.clubService.games();

    // 1. Filter by Month if selected
    if (month !== 'all') {
      games = games.filter(g => g.date && g.date.startsWith(month));
    }

    // 2. Filter by Settlement status
    if (filter === 'settled') {
      return games.filter(g => this.isGameFullySettled(g));
    }
    if (filter === 'pending') {
      return games.filter(g => !this.isGameFullySettled(g));
    }
    return games;
  });

  monthSummaryStats = computed(() => {
    const month = this.selectedMonthFilter();
    let games = this.clubService.games();
    if (month !== 'all') {
      games = games.filter(g => g.date && g.date.startsWith(month));
    }

    let totalExpense = 0;
    let totalCollected = 0;
    let totalPending = 0;

    for (const g of games) {
      const gExp = Math.round(Number(g.totalExpense) || 0);
      totalExpense += gExp;
      const summary = this.getGameSettlementSummary(g);
      totalCollected += Math.round(Number(summary.collectedAmount) || 0);
      totalPending += Math.round(Number(summary.pendingAmount) || 0);
    }

    let label = 'All Recorded Months';
    if (month !== 'all') {
      const mObj = this.availableMonths().find(m => m.key === month);
      label = mObj ? mObj.label : month;
    }

    return {
      monthKey: month,
      label,
      totalGames: games.length,
      totalExpense,
      totalCollected,
      totalPending
    };
  });

  shareMonthBillWhatsApp(): void {
    const stats = this.monthSummaryStats();
    const text = `🏸 *Smash Club - ${stats.label} Bill Statement* 🏸\n` +
      `-----------------------------------------\n` +
      `📅 *Total Sessions:* ${stats.totalGames} Games\n` +
      `💰 *Total Court Expenses:* ₹${stats.totalExpense}\n` +
      `✅ *Collected:* ₹${stats.totalCollected}\n` +
      `⚠️ *Pending Dues:* ₹${stats.totalPending}\n` +
      `-----------------------------------------\n` +
      `Check live statement at: https://smash-club-two.vercel.app`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  settledGamesCount = computed(() => {
    return this.clubService.games().filter(g => this.isGameFullySettled(g)).length;
  });

  pendingGamesCount = computed(() => {
    return this.clubService.games().filter(g => !this.isGameFullySettled(g)).length;
  });

  getGameSettlementSummary(game: Game) {
    const otherAttendees = game.attendees.filter(id => id !== game.paidByPlayerId);
    const isFullySettled = this.isGameFullySettled(game);
    let paidCount = 0;
    let pendingCount = 0;
    let unpaidCount = 0;

    for (const id of otherAttendees) {
      const st = this.getGameStatusForPlayer(game, id);
      if (st.status === 'paid') {
        paidCount++;
      } else if (st.status === 'pending') {
        pendingCount++;
      } else {
        unpaidCount++;
      }
    }

    return {
      totalAttendees: game.attendees.length,
      otherAttendeesCount: otherAttendees.length,
      paidCount,
      pendingCount,
      unpaidCount,
      isFullySettled,
      collectedAmount: (paidCount * game.perPlayerShare).toFixed(2),
      pendingAmount: (unpaidCount * game.perPlayerShare).toFixed(2)
    };
  }

  adminMarkGamePaid(game: Game, playerId: string): void {
    const pName = this.getPlayerName(playerId);
    if (!confirm(`Mark share ₹${game.perPlayerShare} as PAID by ${pName} for game on ${game.date}?`)) {
      return;
    }

    this.clubService.recordPayment({
      playerId,
      amount: game.perPlayerShare,
      mode: 'UPI',
      gameId: game.id,
      notes: `Court share ₹${game.perPlayerShare} for game on ${game.date} (${game.venue}) - Verified & Settled by Phani`
    }).subscribe({
      next: () => {
        this.showToast(`✅ Marked ₹${game.perPlayerShare} as paid for ${pName}!`);
      },
      error: () => {
        this.showToast('Failed to record payment. Please try again.');
      }
    });
  }

  adminRevertGamePaid(game: Game, playerId: string): void {
    const pName = this.getPlayerName(playerId);
    if (!confirm(`Revert payment for ${pName} on ${game.date} back to DUE?`)) {
      return;
    }

    this.clubService.revertGamePayment(game.id, playerId).subscribe({
      next: () => {
        this.showToast(`↺ Payment reverted to DUE for ${pName}!`);
      },
      error: () => {
        this.showToast('Failed to revert payment.');
      }
    });
  }

  openPlayerBreakdown(player: Player): void {
    this.selectedPlayerForBreakdown.set(player);
    this.showBreakdownModal.set(true);
  }

  // Player Detail Popover Inspection Modal
  inspectedPlayer = signal<Player | null>(null);

  openPlayerDetailModal(playerOrId: string | Player): void {
    if (typeof playerOrId === 'string') {
      const p = this.getPlayerById(playerOrId);
      if (p) this.inspectedPlayer.set(p);
    } else {
      this.inspectedPlayer.set(playerOrId);
    }
  }

  shareGameToWhatsApp(game?: Game | null): void {
    const targetGame = game || this.activeCourtSession();
    if (!targetGame) {
      this.showToast('No active match available to share.');
      return;
    }

    const attendeeNames = targetGame.attendees
      .map(id => this.getPlayerName(id))
      .filter(n => !!n)
      .join(', ');

    const dateStr = this.formatDisplayDate(targetGame.date);
    const timeStr = targetGame.timeSlot || '08:00 PM – 10:00 PM';
    const totalCost = Math.round(targetGame.totalExpense);
    const perHead = Math.round(targetGame.perPlayerShare);
    const booker = targetGame.paidByPlayerName || 'Phani';

    const text = 
`🏸 *SMASH CLUB — MATCH UPDATE* 🏸

📍 *Venue:* ${targetGame.venue}
⏰ *Time:* ${timeStr}
📅 *Date:* ${dateStr}
💰 *Court Total:* ₹${totalCost}
💵 *Per Player Share:* ₹${perHead}

👥 *Confirmed Players (${targetGame.attendees.length}):*
${attendeeNames}

👑 *Booked by:* ${booker}

👉 *Login & Check Your Balance:*
https://smash-club-two.vercel.app`;

    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  getPlayerGamesStats(player: Player) {
    const games = this.clubService.games().filter(g => g.attendees.includes(player.id));
    let paidCount = 0;
    let unpaidCount = 0;
    let paidSum = 0;
    let unpaidSum = 0;

    const gameDetails = games.map(g => {
      const isBooker = g.paidByPlayerId === player.id;
      const status = isBooker ? ({ status: 'booker' as const }) : this.getGameStatusForPlayer(g, player.id);
      if (!isBooker) {
        if (status.status === 'paid') {
          paidCount++;
          paidSum += g.perPlayerShare;
        } else {
          unpaidCount++;
          unpaidSum += g.perPlayerShare;
        }
      }
      return { game: g, isBooker, status };
    });

    const totalExpense = Math.round(paidSum + unpaidSum);

    return {
      totalGames: games.length,
      paidCount,
      unpaidCount,
      totalExpense,
      paidSum: Math.round(paidSum),
      unpaidSum: Math.round(unpaidSum),
      gameDetails
    };
  }

  // Booker (Phani) Financial Overview
  bookerStats = computed(() => {
    const games = this.clubService.games();
    const players = this.clubService.players();

    let totalUpfront = 0;
    let phaniShare = 0;
    let totalReceivable = 0;

    for (const g of games) {
      const exp = Math.round(Number(g.totalExpense) || 0);
      totalUpfront += exp;
      const pShare = Math.round(Number(g.perPlayerShare) || 0);
      if (g.attendees.includes('p-phani') || g.paidByPlayerId === 'p-phani') {
        phaniShare += pShare;
      }
      totalReceivable += (exp - pShare);
    }

    let totalPending = 0;
    players.forEach(p => {
      if (p.role !== 'admin' && p.balance < 0) {
        totalPending += Math.abs(p.balance);
      }
    });

    const totalCollected = Math.max(0, totalReceivable - totalPending);

    return {
      totalUpfront,
      phaniShare,
      totalReceivable,
      totalCollected,
      totalPending
    };
  });

  // Current Logged-in Player's Stats (Matches, Total Bill, Paid, Dues)
  myPlayerStats = computed(() => {
    const p = this.myPlayerRecord();
    if (!p) {
      return { totalGames: 0, paidCount: 0, unpaidCount: 0, totalBill: 0, paidAmount: 0, dueAmount: 0 };
    }
    const stats = this.getPlayerGamesStats(p);
    const dueAmt = p.balance < 0 ? Math.abs(p.balance) : 0;
    return {
      totalGames: stats.totalGames,
      paidCount: stats.paidCount,
      unpaidCount: stats.unpaidCount,
      totalBill: stats.totalExpense,
      paidAmount: stats.paidSum,
      dueAmount: dueAmt
    };
  });

  // Game-by-game Payment Status Checker
  getGameStatusForPlayer(game: Game, playerId?: string): { status: 'paid' | 'pending' | 'unpaid'; claim?: Payment } {
    const pId = playerId || this.currentUser()?.id;
    if (!pId) return { status: 'unpaid' };

    // 1. Initial 3 paid games (19-Sep, 22-Sep, 24-Sep)
    if (['2026-09-19', '2026-09-22', '2026-09-24'].includes(game.date) || game.status === 'paid') {
      return { status: 'paid' };
    }

    // 2. Check for approved completed payment in database
    const completed = this.clubService.payments().find(p =>
      p.playerId === pId &&
      p.status === 'completed' &&
      (p.gameId === game.id || (p.notes && p.notes.includes(game.date)) || (p.date === game.date && Math.abs(p.amount - game.perPlayerShare) < 1))
    );
    if (completed) {
      return { status: 'paid', claim: completed };
    }

    // 3. Check for pending payment claim awaiting approval
    const pending = this.clubService.payments().find(p =>
      p.playerId === pId &&
      p.status === 'pending' &&
      (p.gameId === game.id || (p.notes && p.notes.includes(game.date)))
    );
    if (pending) {
      return { status: 'pending', claim: pending };
    }

    return { status: 'unpaid' };
  }

  openGamePayment(game: Game): void {
    this.selectedGameForPayment.set(game);
    this.payAmount.set(game.perPlayerShare);
    this.gamePayUtr.set('');
    this.showGamePayModal.set(true);
  }

  submitGamePayment(): void {
    const game = this.selectedGameForPayment();
    const u = this.currentUser();
    if (!game || !u) return;

    const roundedAmt = Math.round(game.perPlayerShare);
    this.clubService.claimPayment({
      playerId: u.id,
      amount: roundedAmt,
      gameId: game.id,
      utr: this.gamePayUtr().trim(),
      mode: 'UPI',
      notes: `Court share ₹${roundedAmt} for game on ${game.date} (${game.venue})`
    }).subscribe({
      next: () => {
        this.showGamePayModal.set(false);
        this.gamePayUtr.set('');
        this.showToast(`✅ Payment of ₹${roundedAmt} reported for ${game.date}! Awaiting Phani's approval in the app.`);
      },
      error: () => {
        this.showToast('Failed to report payment. Please try again.');
      }
    });
  }

  getUpiIntentUrl(amount: number, game?: Game | null): string {
    const u = this.currentUser();
    const cleanAmt = Math.round(amount);
    const note = game ? `SmashClub_${game.date}_${u?.name || 'Player'}` : `SmashClub_Settlement_${u?.name || 'Player'}`;
    return `upi://pay?pa=8801147452@ybl&pn=Phani&am=${cleanAmt}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  getPhonePeIntentUrl(amount: number, game?: Game | null): string {
    const u = this.currentUser();
    const cleanAmt = Math.round(amount);
    const note = game ? `SmashClub_${game.date}_${u?.name || 'Player'}` : `SmashClub_Settlement_${u?.name || 'Player'}`;
    return `phonepe://pay?pa=8801147452@ybl&pn=Phani&am=${cleanAmt}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  getGPayIntentUrl(amount: number, game?: Game | null): string {
    const u = this.currentUser();
    const cleanAmt = Math.round(amount);
    const note = game ? `SmashClub_${game.date}_${u?.name || 'Player'}` : `SmashClub_Settlement_${u?.name || 'Player'}`;
    return `tez://upi/pay?pa=8801147452@ybl&pn=Phani&am=${cleanAmt}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  getPaytmIntentUrl(amount: number, game?: Game | null): string {
    const u = this.currentUser();
    const cleanAmt = Math.round(amount);
    const note = game ? `SmashClub_${game.date}_${u?.name || 'Player'}` : `SmashClub_Settlement_${u?.name || 'Player'}`;
    return `paytmmp://pay?pa=8801147452@ybl&pn=Phani&am=${cleanAmt}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  copyUpiId(upiId: string = '8801147452@ybl'): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(upiId).then(() => {
        this.showToast(`📋 Copied UPI ID: ${upiId}`);
      }).catch(() => {
        this.showToast(`UPI ID: ${upiId}`);
      });
    } else {
      this.showToast(`UPI ID: ${upiId}`);
    }
  }

  // ==========================================================================
  // PROFILE DETAILS & AVATAR
  // ==========================================================================
  openProfileModal(): void {
    const p = this.myPlayerRecord();
    const u = this.currentUser();
    if (!p && !u) return;

    this.profileName.set(p?.name || u?.name || '');
    this.profilePhone.set(p?.phone || u?.phone || '');
    this.profileAvatar.set(p?.avatar || u?.avatar || '');
    this.profileSkill.set(p?.skill || 'Intermediate');
    this.profileHand.set(p?.hand || 'Right-handed');
    this.profileUpiId.set(p?.upiId || '');
    this.profilePassword.set(p?.password || '');
    this.profileError.set(null);
    this.showProfileModal.set(true);
  }

  selectAvatar(preset: string): void {
    this.profileAvatar.set(preset);
  }

  handleAvatarUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.profileError.set('Please select a valid image file (JPG, PNG, WEBP)');
        return;
      }

      this.profileError.set(null);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Resize to crisp avatar size (360x360 square with center-crop)
            const maxDim = 360;
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            const canvas = document.createElement('canvas');
            canvas.width = maxDim;
            canvas.height = maxDim;

            const minSide = Math.min(width, height);
            const srcX = (width - minSide) / 2;
            const srcY = (height - minSide) / 2;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, srcX, srcY, minSide, minSide, 0, 0, maxDim, maxDim);
              // Compressed JPEG at 0.85 quality (~35KB-50KB)
              const compressedData = canvas.toDataURL('image/jpeg', 0.85);
              this.profileAvatar.set(compressedData);
              this.profileError.set(null);
            } else {
              this.profileAvatar.set(e.target.result);
            }
          } catch (err) {
            this.profileAvatar.set(e.target.result);
          }
        };
        img.onerror = () => {
          this.profileError.set('Failed to read image. Please select another photo.');
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        this.profileError.set('Error reading photo file.');
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.profileError.set(null);
    const u = this.currentUser();
    const p = this.myPlayerRecord();
    const id = p?.id || u?.id;
    if (!id) {
      this.profileError.set('Session expired. Please log in again.');
      return;
    }

    const name = this.profileName().trim();
    const phone = this.profilePhone().trim().replace(/\D/g, '');

    if (!name) {
      this.profileError.set('Player name cannot be empty');
      return;
    }
    if (phone.length !== 10) {
      this.profileError.set('Please enter a valid 10-digit mobile number');
      return;
    }

    this.profileSaving.set(true);

    this.clubService.updatePlayer(id, {
      name,
      phone,
      avatar: this.profileAvatar(),
      skill: this.profileSkill(),
      hand: this.profileHand(),
      upiId: this.profileUpiId(),
      password: this.profilePassword() || undefined
    }).subscribe({
      next: (updated) => {
        this.profileSaving.set(false);
        this.showProfileModal.set(false);
        this.showToast('✨ Profile & photo updated successfully!');
      },
      error: (err) => {
        this.profileSaving.set(false);
        const errMsg = err.error?.error || (err.status === 413 ? 'Image is too large. Please select another photo.' : 'Failed to save profile. Try again.');
        this.profileError.set(errMsg);
      }
    });
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  submitLogin(): void {
    this.loginError.set(null);
    const id = this.loginIdentifier().trim();
    if (!id) {
      this.loginError.set('Please enter your Name or Phone number');
      return;
    }

    const pwd = this.loginPassword().trim();
    if (!pwd) {
      this.loginError.set(id.toLowerCase() === 'phani'
        ? 'Please enter Phani\'s admin password'
        : 'Password is required to sign in');
      return;
    }

    this.clubService.login(id, pwd, this.loginRole()).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`✨ Welcome, ${res.user.name}!`);
          this.triggerLoginCelebration();
          // Auto select all players as attendees by default for convenience
          this.gameAttendees.set(this.clubService.players().map(p => p.id));
          const adminP = this.clubService.players().find(p => p.role === 'admin');
          if (adminP) {
            this.gamePaidBy.set(adminP.id);
          }
        }
      },
      error: (err: any) => {
        if (err.status === 0) {
          this.loginError.set('Backend server (port 5000) is not reachable. Ensure "node server.js" is running.');
        } else {
          this.loginError.set(err.error?.error || 'Login failed. Check name or phone.');
        }
      }
    });
  }

  logout(): void {
    this.clubService.logout();
    this.showToast('Logged out successfully');
  }

  // ==========================================================================
  // DYNAMIC GAME SCHEDULING (Today, Tomorrow, Any Date)
  // ==========================================================================
  setToday(): void {
    this.gameDate.set(new Date().toISOString().split('T')[0]);
  }

  setTomorrow(): void {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    this.gameDate.set(tom.toISOString().split('T')[0]);
  }

  setCourtPreset(amount: number): void {
    this.gameCourtRent.set(amount);
  }

  setVenue(venue: string): void {
    this.gameVenue.set(venue);
  }

  setTimeSlot(slot: string): void {
    this.gameTimeSlot.set(slot);
  }

  toggleAttendee(playerId: string): void {
    const current = this.gameAttendees();
    if (current.includes(playerId)) {
      if (current.length > 1) {
        this.gameAttendees.set(current.filter(id => id !== playerId));
      } else {
        this.showToast('Select at least 1 attendee to split the court.');
      }
    } else {
      this.gameAttendees.set([...current, playerId]);
    }
  }

  isAttendeeSelected(playerId: string): boolean {
    return this.gameAttendees().includes(playerId);
  }

  // Save game to MongoDB Atlas and split amongst attendees
  saveGameAndSplit(): void {
    const total = this.totalGameExpense();
    const count = this.gameAttendees().length;
    if (total <= 0) {
      this.showToast('Please enter a valid court booking fee');
      return;
    }
    if (count === 0) {
      this.showToast('Please select at least 1 player who played');
      return;
    }

    const payer = this.clubService.players().find(p => p.id === this.gamePaidBy());

    this.clubService.addGame({
      venue: this.gameVenue(),
      date: this.gameDate(),
      timeSlot: this.gameTimeSlot(),
      courtRent: Number(this.gameCourtRent()),
      shuttleCost: Number(this.gameShuttleCost()),
      paidByPlayerId: this.gamePaidBy() || this.currentUser()?.id || 'p-admin',
      paidByPlayerName: payer ? payer.name : (this.currentUser()?.name || 'Phani'),
      attendees: this.gameAttendees(),
      notes: this.gameNotes() || `Court ₹${this.gameCourtRent()} on ${this.gameDate()}`
    }).subscribe({
      next: () => {
        this.showToast(`✨ Saved to Database! Each attendee owes ₹${this.perPlayerShare()}`);
      },
      error: (err) => {
        this.showToast('Failed to save game: ' + (err.error?.error || err.message));
      }
    });
  }

  scrollToBooking(): void {
    const el = document.getElementById('courtBookingSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================================================
  // DYNAMIC PLAYERS (Add, Delete)
  // ==========================================================================
  submitAddPlayer(): void {
    this.playerFormError.set(null);
    const name = this.newPlayerName().trim();
    const phone = this.newPlayerPhone().trim().replace(/\D/g, '');

    if (!name) {
      this.playerFormError.set('Player name is required');
      return;
    }
    if (phone.length !== 10) {
      this.playerFormError.set('Phone must be exactly 10 digits');
      return;
    }

    this.clubService.addPlayer({
      name,
      phone,
      role: this.newPlayerRole()
    }).subscribe({
      next: (newP) => {
        this.showAddPlayerModal.set(false);
        this.newPlayerName.set('');
        this.newPlayerPhone.set('');
        // Add to attendees list automatically
        this.gameAttendees.update(list => [...list, newP.id]);
        this.showToast(`👤 ${name} added to Database!`);
      },
      error: (err) => {
        this.playerFormError.set(err.error?.error || 'Failed to add player');
      }
    });
  }

  deletePlayer(id: string, name: string): void {
    if (confirm(`Remove ${name} from Smash Club?`)) {
      this.clubService.deletePlayer(id).subscribe(() => {
        this.gameAttendees.update(list => list.filter(pId => pId !== id));
        this.showToast(`Removed ${name}`);
      });
    }
  }

  // ==========================================================================
  // PAYMENTS & SETTLEMENTS
  // ==========================================================================
  openPaymentFor(player: Player): void {
    this.payPlayerId.set(player.id);
    this.payAmount.set(player.balance < 0 ? Math.abs(player.balance) : 300);
    this.showPaymentModal.set(true);
  }

  submitPayment(): void {
    const amount = Number(this.payAmount());
    if (amount <= 0) {
      this.showToast('Please enter a valid amount');
      return;
    }

    this.clubService.recordPayment({
      playerId: this.payPlayerId(),
      amount,
      mode: this.payMode()
    }).subscribe(() => {
      this.showPaymentModal.set(false);
      this.showToast(`✅ Payment of ₹${amount} saved and balance updated!`);
    });
  }

  openMyUpiQr(): void {
    const p = this.myPlayerRecord();
    this.payAmount.set(p && p.balance < 0 ? Math.round(Math.abs(p.balance)) : 300);
    this.showUpiModal.set(true);
  }

  submitPaymentClaim(): void {
    const p = this.myPlayerRecord();
    if (!p || p.balance >= 0) {
      this.showToast('You do not have any pending dues!');
      return;
    }
    const dueAmt = Math.round(Math.abs(p.balance));
    this.clubService.claimPayment({
      playerId: p.id,
      amount: dueAmt,
      utr: this.claimUtr().trim(),
      mode: 'UPI'
    }).subscribe({
      next: () => {
        this.showClaimModal.set(false);
        this.showUpiModal.set(false);
        this.claimUtr.set('');
        this.showToast('✅ Payment reported! Phani will verify and approve in the app.');
      },
      error: () => {
        this.showToast('Failed to submit claim. Please try again.');
      }
    });
  }

  approveClaim(paymentId: string): void {
    this.clubService.approvePayment(paymentId).subscribe({
      next: () => {
        this.showToast('✅ Payment approved! Player dues settled.');
      },
      error: () => {
        this.showToast('Error approving payment.');
      }
    });
  }

  rejectClaim(paymentId: string): void {
    this.clubService.rejectPayment(paymentId).subscribe({
      next: () => {
        this.showToast('Payment claim rejected.');
      },
      error: () => {
        this.showToast('Error rejecting payment.');
      }
    });
  }

  // ==========================================================================
  // MONGODB ATLAS PASSWORD SAVE
  // ==========================================================================
  saveAtlasPassword(): void {
    const pwd = this.atlasPassword().trim();
    if (!pwd) {
      this.atlasFeedback.set({ success: false, message: 'Please enter your MongoDB Atlas password' });
      return;
    }

    this.atlasConnecting.set(true);
    this.atlasFeedback.set(null);

    this.clubService.setAtlasPassword(pwd).subscribe({
      next: (res) => {
        this.atlasConnecting.set(false);
        this.atlasFeedback.set(res);
        if (res.success) {
          this.showToast('⚡ Connected to badmintiondatabase MongoDB Atlas!');
        }
      },
      error: (err) => {
        this.atlasConnecting.set(false);
        this.atlasFeedback.set({
          success: false,
          message: err.error?.message || 'Connection failed. Check password & Atlas IP Access (0.0.0.0/0).'
        });
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  getPlayerName(id: string): string {
    const p = this.clubService.players().find(pl => pl.id === id);
    return p ? p.name : id;
  }

  getPlayerByName(name: string): Player | undefined {
    if (!name) return undefined;
    const lower = name.trim().toLowerCase();
    return this.clubService.players().find(p => p.name.trim().toLowerCase() === lower || p.id === name);
  }

  getPlayerById(id: string): Player | undefined {
    return this.clubService.players().find(p => p.id === id);
  }

  getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  activeCourtSession = computed(() => {
    const games = this.clubService.games();
    if (games.length === 0) return null;
    const todayStr = this.getTodayDateString();
    // 1. Look for game today (prefer real game with confirmed attendees)
    const todayGames = games.filter(g => g.date === todayStr);
    if (todayGames.length > 0) {
      return todayGames.reduce((prev, curr) => (curr.attendees?.length || 0) >= (prev.attendees?.length || 0) ? curr : prev);
    }
    // 2. Look for any upcoming game (today or future)
    const upcoming = games.filter(g => g.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    if (upcoming.length > 0) return upcoming[0];
    // 3. Fallback to the latest game session
    return games[0];
  });

  isTodayCourtSession = computed(() => {
    const sess = this.activeCourtSession();
    if (!sess) return false;
    return sess.date === this.getTodayDateString();
  });

  getAttendeeNamesSummary(attendeeIds?: string[]): string {
    if (!attendeeIds || attendeeIds.length === 0) return '';
    return attendeeIds.map(id => this.getPlayerName(id)).join(', ');
  }

  formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  // ==========================================================================
  // WEB PUSH NOTIFICATIONS REGISTRATION & CONTROLS
  // ==========================================================================
  async registerPushForUser(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      this.clubService.getVapidPublicKey().subscribe({
        next: async (res) => {
          if (!res || !res.publicKey) return;
          try {
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              const convertedVapidKey = urlBase64ToUint8Array(res.publicKey);
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey as any
              });
            }

            const user = this.currentUser();
            this.clubService.subscribeToPush({
              subscription: sub.toJSON(),
              playerId: user?.id || 'anonymous',
              playerName: user?.name || 'Smash Member',
              role: user?.role || 'player'
            }).subscribe({
              next: () => console.log('[Push] Subscription synced to server for', user?.name),
              error: (e) => console.error('[Push] Sync error:', e)
            });
          } catch (e) {
            console.error('[Push Subscription Error]', e);
          }
        },
        error: (err) => console.error('[VAPID Fetch Error]', err)
      });
      return true;
    } catch (e) {
      console.error('[SW Register Error]', e);
      return false;
    }
  }

  async togglePushNotifications(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      this.showToast('Push notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      this.sendTestAlert();
      return;
    }

    if (Notification.permission === 'denied') {
      this.showToast('⚠️ Notifications blocked in browser settings. Please allow notifications in site permissions.');
      return;
    }

    this.pushLoading.set(true);
    try {
      const perm = await Notification.requestPermission();
      this.pushPermission.set(perm);
      if (perm === 'granted') {
        await this.registerPushForUser();
        this.pushLoading.set(false);
        this.showToast('🔔 Phone lock-screen notifications enabled! Sending test alert...');
        setTimeout(() => this.sendTestAlert(), 1200);
      } else {
        this.pushLoading.set(false);
        this.showToast('Notification permission was not granted.');
      }
    } catch (err: any) {
      this.pushLoading.set(false);
      this.showToast('Error enabling notifications: ' + err.message);
    }
  }

  sendTestAlert(): void {
    const user = this.currentUser();
    this.clubService.sendTestPush({
      playerId: user?.id,
      role: user?.role,
      title: '🏸 Smash Club Phone Alert!',
      body: `Hi ${user?.name || 'there'}! Phone lock-screen push alerts are active and working.`
    }).subscribe({
      next: (res) => {
        this.showToast('🔔 Test alert sent to phone lock screen!');
      },
      error: () => {
        this.showToast('Failed to send test alert.');
      }
    });
  }

  // Broadcast Modal State (Alerting Players about Match Schedules, Cancellations, or Updates)
  showBroadcastModal = signal<boolean>(false);
  broadcastType = signal<'match' | 'no-match' | 'custom'>('match');
  broadcastCustomTitle = signal<string>('');
  broadcastCustomBody = signal<string>('');
  broadcastSending = signal<boolean>(false);

  openBroadcastModal(): void {
    this.broadcastType.set('match');
    this.broadcastCustomTitle.set(`🏸 Badminton Match Alert (${this.gameDate()})!`);
    this.broadcastCustomBody.set(`Session at ${this.gameVenue()}! Court share approx ₹${Math.round(Number(this.perPlayerShare()))}. Tap to view details.`);
    this.showBroadcastModal.set(true);
  }

  selectBroadcastType(type: 'match' | 'no-match' | 'custom'): void {
    this.broadcastType.set(type);
    if (type === 'match') {
      this.broadcastCustomTitle.set(`🏸 Badminton Match Alert (${this.gameDate()})!`);
      this.broadcastCustomBody.set(`Session at ${this.gameVenue()}! Court share approx ₹${Math.round(Number(this.perPlayerShare()))}. Tap to view details.`);
    } else if (type === 'no-match') {
      this.broadcastCustomTitle.set(`📢 No Badminton Match Today (${this.gameDate()})`);
      this.broadcastCustomBody.set(`Notice: No match scheduled for today (${this.gameDate()}). Rest day! Next session will be announced soon.`);
    } else {
      this.broadcastCustomTitle.set(`🏸 Smash Club Update (${this.gameDate()})`);
      this.broadcastCustomBody.set('');
    }
  }

  executeBroadcastAlert(): void {
    const title = this.broadcastCustomTitle().trim();
    const body = this.broadcastCustomBody().trim();
    if (!title || !body) {
      this.showToast('Please enter both title and message body.');
      return;
    }
    this.broadcastSending.set(true);
    this.clubService.sendTestPush({
      title,
      body
    }).subscribe({
      next: (res: any) => {
        this.broadcastSending.set(false);
        this.showBroadcastModal.set(false);
        const count = res?.result?.sent || 0;
        this.showToast(`📢 Alert sent to ${count} player phone(s)!`);
      },
      error: () => {
        this.broadcastSending.set(false);
        this.showToast('Failed to broadcast alert. Please try again.');
      }
    });
  }

  broadcastGameAlert(): void {
    this.openBroadcastModal();
  }

  ngOnDestroy(): void {
    if (this.celebrationAnimId) {
      cancelAnimationFrame(this.celebrationAnimId);
    }
    this.celebrationTimeouts.forEach(t => clearTimeout(t));
  }

  // ==========================================================================
  // LOGIN CELEBRATION SHUTTLECOCK & CONFETTI PARTY POPPERS BURST
  // Launches realistic 3D shuttlecocks, shimmering confetti, and celebration sparkles
  // ==========================================================================
  triggerLoginCelebration(): void {
    if (typeof window === 'undefined') return;

    this.isCelebrationActive.set(true);

    if (this.celebrationAnimId) {
      cancelAnimationFrame(this.celebrationAnimId);
    }
    this.celebrationTimeouts.forEach(t => clearTimeout(t));
    this.celebrationTimeouts = [];

    setTimeout(() => {
      const canvas = this.celebrationCanvasRef?.nativeElement || (document.getElementById('loginCelebrationCanvas') as HTMLCanvasElement);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      interface Particle {
        type: 'shuttle' | 'confetti' | 'sparkle';
        x: number;
        y: number;
        vx: number;
        vy: number;
        rotation: number;
        vRot: number;
        size: number;
        color: string;
        emoji?: string;
        wobble: number;
        vWobble: number;
        life: number;
        maxLife: number;
        gravity: number;
        drag: number;
      }

      const particles: Particle[] = [];
      const colors = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#60A5FA', '#FBBF24', '#34D399', '#EC4899', '#FFFFFF'];
      const sparkles = ['✨', '⭐', '🎉', '🌟', '💫'];

      // Draw high-detail 3D tournament feather shuttlecock
      const drawShuttle = (c: CanvasRenderingContext2D, size: number) => {
        const s = size / 32;
        c.save();

        // 1. Feather Skirt
        const skirtGrad = c.createLinearGradient(0, -18 * s, 0, 4 * s);
        skirtGrad.addColorStop(0, '#FFFFFF');
        skirtGrad.addColorStop(0.65, '#F8FAFC');
        skirtGrad.addColorStop(1, '#CBD5E1');

        c.beginPath();
        c.moveTo(-13 * s, -18 * s);
        c.lineTo(13 * s, -18 * s);
        c.lineTo(5.5 * s, 4 * s);
        c.lineTo(-5.5 * s, 4 * s);
        c.closePath();
        c.fillStyle = skirtGrad;
        c.shadowColor = 'rgba(0, 0, 0, 0.28)';
        c.shadowBlur = 6 * s;
        c.shadowOffsetY = 3 * s;
        c.fill();

        // Feather ribs
        c.shadowColor = 'transparent';
        c.strokeStyle = '#94A3B8';
        c.lineWidth = 1 * s;
        for (let i = -10; i <= 10; i += 3.5) {
          c.beginPath();
          c.moveTo(i * s * 1.25, -18 * s);
          c.lineTo(i * s * 0.45, 4 * s);
          c.stroke();
        }

        // Dual blue binding threads
        c.strokeStyle = '#2563EB';
        c.lineWidth = 1.3 * s;
        c.beginPath();
        c.arc(0, -6 * s, 8 * s, 0.2, Math.PI - 0.2);
        c.stroke();

        c.beginPath();
        c.arc(0, -12 * s, 11.5 * s, 0.2, Math.PI - 0.2);
        c.stroke();

        // Cork base
        const corkGrad = c.createRadialGradient(-1.5 * s, 7 * s, 1 * s, 0, 9 * s, 7 * s);
        corkGrad.addColorStop(0, '#FFFFFF');
        corkGrad.addColorStop(0.5, '#FEF3C7');
        corkGrad.addColorStop(1, '#D97706');

        c.beginPath();
        c.arc(0, 5 * s, 6 * s, 0, Math.PI);
        c.fillStyle = corkGrad;
        c.fill();

        // Red band on cork
        c.fillStyle = '#EF4444';
        c.fillRect(-5.5 * s, 3.5 * s, 11 * s, 2 * s);

        c.restore();
      };

      const spawnBurst = (originX: number, originY: number, baseAngleDeg: number, spreadDeg: number, count: number) => {
        for (let i = 0; i < count; i++) {
          const angle = (baseAngleDeg + (Math.random() - 0.5) * spreadDeg) * (Math.PI / 180);
          const speed = 14 + Math.random() * 11;
          const isShuttle = Math.random() < 0.28;
          const isSparkle = !isShuttle && Math.random() < 0.22;

          particles.push({
            type: isShuttle ? 'shuttle' : isSparkle ? 'sparkle' : 'confetti',
            x: originX + (Math.random() - 0.5) * 30,
            y: originY + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.16,
            size: isShuttle ? 28 + Math.random() * 12 : isSparkle ? 18 + Math.random() * 8 : 8 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            emoji: isSparkle ? sparkles[Math.floor(Math.random() * sparkles.length)] : undefined,
            wobble: Math.random() * Math.PI * 2,
            vWobble: 0.08 + Math.random() * 0.12,
            life: 0,
            maxLife: 130 + Math.floor(Math.random() * 50),
            gravity: isShuttle ? 0.36 : 0.26,
            drag: 0.985
          });
        }
      };

      // Wave 1: Left and right bottom corners blast up towards the sky!
      spawnBurst(width * 0.12, height * 0.96, -55, 34, 45);
      spawnBurst(width * 0.88, height * 0.96, -125, 34, 45);

      // Wave 2: Center burst after 220ms
      const t1 = setTimeout(() => {
        spawnBurst(width * 0.5, height * 0.92, -90, 48, 50);
      }, 220);
      this.celebrationTimeouts.push(t1);

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        let activeCount = 0;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= p.drag;
          p.rotation += p.vRot;
          p.wobble += p.vWobble;
          p.life++;
          const alpha = Math.max(0, 1 - (p.life / p.maxLife));

          if (alpha > 0.01 && p.y < height + 80) {
            activeCount++;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = alpha;

            if (p.type === 'shuttle') {
              drawShuttle(ctx, p.size);
            } else if (p.type === 'sparkle') {
              ctx.font = `${p.size}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(p.emoji || '✨', 0, 0);
            } else {
              // 3D twirling metallic confetti
              ctx.scale(Math.cos(p.wobble), 1);
              ctx.fillStyle = p.color;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
              ctx.shadowBlur = 3;
              ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3);
            }

            ctx.restore();
          }
        }

        if (activeCount > 0) {
          this.celebrationAnimId = requestAnimationFrame(render);
        } else {
          ctx.clearRect(0, 0, width, height);
          this.isCelebrationActive.set(false);
        }
      };

      this.celebrationAnimId = requestAnimationFrame(render);

      const tStop = setTimeout(() => {
        if (this.celebrationAnimId) {
          cancelAnimationFrame(this.celebrationAnimId);
        }
        ctx.clearRect(0, 0, width, height);
        this.isCelebrationActive.set(false);
      }, 3800);
      this.celebrationTimeouts.push(tStop);
    }, 40);
  }
}
