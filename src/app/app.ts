import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from './services/club.service';
import { Player, Game, Payment } from './models/club.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  clubService = inject(ClubService);

  constructor() {
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
    this.loginPassword.set(player.name.toLowerCase() + '@123');
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
  claimUtr = signal<string>('');
  toastMessage = signal<string | null>(null);

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

  unpaidGamesList = computed(() => {
    return this.myAttendedGames().filter(g => this.getGameStatusForPlayer(g).status === 'unpaid');
  });

  isGameFullySettled(game: Game): boolean {
    if (['2026-09-19', '2026-09-22', '2026-09-24'].includes(game.date) || game.status === 'paid') {
      return true;
    }
    const otherAttendees = game.attendees.filter(id => id !== game.paidByPlayerId);
    if (otherAttendees.length === 0) return true;
    return otherAttendees.every(id => this.getGameStatusForPlayer(game, id).status === 'paid');
  }

  filteredGames = computed(() => {
    const filter = this.adminGameFilter();
    const games = this.clubService.games();
    if (filter === 'settled') {
      return games.filter(g => this.isGameFullySettled(g));
    }
    if (filter === 'pending') {
      return games.filter(g => !this.isGameFullySettled(g));
    }
    return games;
  });

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

  openPlayerBreakdown(player: Player): void {
    this.selectedPlayerForBreakdown.set(player);
    this.showBreakdownModal.set(true);
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

    return {
      totalGames: games.length,
      paidCount,
      unpaidCount,
      paidSum: paidSum.toFixed(2),
      unpaidSum: unpaidSum.toFixed(2),
      gameDetails
    };
  }

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

    this.clubService.claimPayment({
      playerId: u.id,
      amount: game.perPlayerShare,
      gameId: game.id,
      utr: this.gamePayUtr().trim(),
      mode: 'UPI',
      notes: `Court share ₹${game.perPlayerShare} for game on ${game.date} (${game.venue})`
    }).subscribe({
      next: () => {
        this.showGamePayModal.set(false);
        this.gamePayUtr.set('');
        this.showToast(`✅ Payment of ₹${game.perPlayerShare} reported for ${game.date}! Awaiting Phani's approval.`);
      },
      error: () => {
        this.showToast('Failed to report payment. Please try again.');
      }
    });
  }

  getUpiIntentUrl(amount: number, game?: Game | null): string {
    const u = this.currentUser();
    const note = game ? `SmashClub_${game.date}_${u?.name || 'Player'}` : `SmashClub_Settlement_${u?.name || 'Player'}`;
    return `upi://pay?pa=smashclub@okhdfcbank&pn=Phani&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
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
        this.showToast('✨ Profile & photo updated in MongoDB Atlas cloud!');
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

    this.clubService.login(id, this.loginPassword().trim(), this.loginRole()).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`✨ Welcome, ${res.user.name}!`);
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
      courtRent: Number(this.gameCourtRent()),
      shuttleCost: Number(this.gameShuttleCost()),
      paidByPlayerId: this.gamePaidBy() || this.currentUser()?.id || 'p-admin',
      paidByPlayerName: payer ? payer.name : (this.currentUser()?.name || 'Phani'),
      attendees: this.gameAttendees(),
      notes: this.gameNotes() || `Court ₹${this.gameCourtRent()} on ${this.gameDate()}`
    }).subscribe(() => {
      this.showToast(`✨ Saved to Database! Each attendee owes ₹${this.perPlayerShare()}`);
    });
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
    this.payAmount.set(p && p.balance < 0 ? Math.abs(p.balance) : 300);
    this.showUpiModal.set(true);
  }

  submitPaymentClaim(): void {
    const p = this.myPlayerRecord();
    if (!p || p.balance >= 0) {
      this.showToast('You do not have any pending dues!');
      return;
    }
    const dueAmt = Math.abs(p.balance);
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
        this.showToast('✅ Payment reported! Phani will verify and approve.');
      },
      error: () => {
        this.showToast('Failed to submit claim. Please try again.');
      }
    });
  }

  approveClaim(paymentId: string): void {
    this.clubService.approvePayment(paymentId).subscribe({
      next: () => {
        this.showToast('✅ Payment approved! Player dues settled in MongoDB Atlas.');
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
}
