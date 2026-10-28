import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { Game, Player } from '../../core/models/smash.models';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="games-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.games') }}</h1>
          <p class="page-desc">Schedule badminton sessions, manage venue bookings, track attendance, and split court costs.</p>
        </div>
        <div class="header-actions" *ngIf="auth.isAdmin()">
          <button (click)="openCreateModal()" class="btn btn-primary">
            <span>➕ {{ i18n.t('action.addGame') }}</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-bar">
        <button class="filter-tab" [class.active]="filterStatus === 'ALL'" (click)="filterStatus = 'ALL'">All Games ({{ games.length }})</button>
        <button class="filter-tab" [class.active]="filterStatus === 'SCHEDULED'" (click)="filterStatus = 'SCHEDULED'">Scheduled ({{ getCount('SCHEDULED') }})</button>
        <button class="filter-tab" [class.active]="filterStatus === 'COMPLETED'" (click)="filterStatus = 'COMPLETED'">Completed ({{ getCount('COMPLETED') }})</button>
      </div>

      <!-- Games Grid -->
      <div class="games-grid">
        <div class="game-card card" *ngFor="let game of filteredGames">
          <div class="card-header">
            <div class="game-date-badge">
              <span class="g-day">{{ getDay(game.gameDate) }}</span>
              <span class="g-month">{{ getMonth(game.gameDate) }}</span>
            </div>
            <div class="game-status-wrap">
              <span class="badge" [class.badge-completed]="game.status === 'COMPLETED'" [class.badge-scheduled]="game.status === 'SCHEDULED'" [class.badge-cancelled]="game.status === 'CANCELLED'">
                {{ game.status }}
              </span>
              <span class="badge badge-paid" *ngIf="game.financialConfirmed">✓ Financials Reconciled</span>
            </div>
          </div>

          <div class="game-body">
            <h3 class="game-title">{{ game.title }}</h3>
            <p class="game-venue">📍 <strong>{{ game.courtName }}</strong> • {{ game.location }}</p>
            <p class="game-time">⏰ {{ game.startTime }} - {{ game.endTime }} • Organizer: <strong>{{ game.organizerName }}</strong></p>

            <div class="cost-breakdown-box">
              <div class="cost-row">
                <span>Court Booking:</span>
                <span class="cost-digit">₹{{ game.courtBookingCost }}</span>
              </div>
              <div class="cost-row">
                <span>Shuttles:</span>
                <span class="cost-digit">₹{{ game.shuttlecockExpenses }}</span>
              </div>
              <div class="cost-row" *ngIf="game.additionalExpenses > 0">
                <span>Additional:</span>
                <span class="cost-digit">₹{{ game.additionalExpenses }}</span>
              </div>
              <div class="cost-row total-row">
                <span>Total Session Cost:</span>
                <span class="total-cost text-lime">₹{{ game.totalCost }}</span>
              </div>
            </div>

            <!-- Participants Preview -->
            <div class="participants-section">
              <div class="p-header">
                <span class="p-title">Participants ({{ getAttendedCount(game) }}/{{ game.participants.length }} Attended)</span>
                <span class="p-share">~ ₹{{ game.perPlayerEstimatedShare }} / player</span>
              </div>
              <div class="participant-chips">
                <span class="p-chip" *ngFor="let p of game.participants" [class.absent-chip]="!p.attended">
                  <span class="chip-dot" [class.dot-green]="p.attended" [class.dot-gray]="!p.attended"></span>
                  {{ p.playerName }}
                  <span class="chip-paid-tag" *ngIf="p.paymentStatus === 'PAID'">✓ Paid</span>
                </span>
              </div>
            </div>
          </div>

          <div class="game-footer">
            <button (click)="openAttendanceModal(game)" class="btn btn-secondary btn-sm" *ngIf="auth.isAdmin()">
              <span>📝 {{ i18n.t('action.recordAttendance') }}</span>
            </button>
            <span class="split-model-tag">Split: {{ game.splitType }}</span>
          </div>
        </div>
      </div>

      <!-- CREATE GAME MODAL -->
      <div class="modal-backdrop" *ngIf="showCreateModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🏸 Create New Badminton Game</h3>
            <button (click)="showCreateModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Game Title *</label>
              <input type="text" [(ngModel)]="newGame.title" class="form-control" placeholder="e.g. Saturday Morning Smash League" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Court / Arena Name *</label>
                <input type="text" [(ngModel)]="newGame.courtName" class="form-control" placeholder="Star Badminton Arena, Court 3" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Location</label>
                <input type="text" [(ngModel)]="newGame.location" class="form-control" placeholder="Gachibowli, Hyderabad" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Session Date *</label>
                <input type="date" [(ngModel)]="newGame.gameDate" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Start Time</label>
                <input type="time" [(ngModel)]="newGame.startTime" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">End Time</label>
                <input type="time" [(ngModel)]="newGame.endTime" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Court Booking Cost (₹) *</label>
                <input type="number" [(ngModel)]="newGame.courtBookingCost" class="form-control" placeholder="600" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Shuttlecock Cost (₹)</label>
                <input type="number" [(ngModel)]="newGame.shuttlecockExpenses" class="form-control" placeholder="240" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Additional Expenses (₹)</label>
                <input type="number" [(ngModel)]="newGame.additionalExpenses" class="form-control" placeholder="0" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Select Participating Players ({{ selectedPlayerIds.length }} selected)</label>
              <div class="player-checklist">
                <label class="checkbox-label" *ngFor="let player of allPlayers">
                  <input type="checkbox" [checked]="selectedPlayerIds.includes(player.id)" (change)="togglePlayerSelection(player.id)" />
                  <span>{{ player.name }} ({{ player.uniquePlayerId }})</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea [(ngModel)]="newGame.notes" class="form-control" rows="2" placeholder="e.g. Feather shuttles, bring non-marking shoes"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showCreateModal = false" class="btn btn-secondary">{{ i18n.t('action.cancel') }}</button>
            <button (click)="saveGame()" class="btn btn-primary">{{ i18n.t('action.save') }}</button>
          </div>
        </div>
      </div>

      <!-- ATTENDANCE & RE-SPLIT MODAL -->
      <div class="modal-backdrop" *ngIf="showAttendanceModal && selectedGame">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>📝 Record Actual Attendance & Recalculate Share</h3>
            <button (click)="showAttendanceModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <div class="alert-notice">
              <span class="notice-icon">ℹ️</span>
              <p>Check the players who actually played. The total session expense of <strong>₹{{ selectedGame.totalCost }}</strong> will be recalculated among confirmed attendees.</p>
            </div>

            <div class="attendance-list">
              <div class="attendee-row" *ngFor="let p of selectedGame.participants">
                <label class="attend-toggle">
                  <input type="checkbox" [(ngModel)]="attendanceMap[p.playerId]" />
                  <span class="attend-name">{{ p.playerName }}</span>
                </label>
                <span class="status-indicator" [class.text-success]="attendanceMap[p.playerId]" [class.text-muted]="!attendanceMap[p.playerId]">
                  {{ attendanceMap[p.playerId] ? 'Attended' : 'Absent' }}
                </span>
              </div>
            </div>

            <!-- Financial Impact Preview -->
            <div class="financial-impact-card">
              <h4>Financial Recalculation Impact</h4>
              <div class="impact-metrics">
                <div class="impact-col">
                  <span>Actual Attendees:</span>
                  <strong>{{ calculateSelectedAttendeesCount() }} Players</strong>
                </div>
                <div class="impact-col">
                  <span>New Equal Share:</span>
                  <strong class="text-lime">₹{{ calculateNewPerPlayerShare() }} / player</strong>
                </div>
              </div>
              <p class="reconcile-check">✓ System will verify exact penny remainder reconciliation before saving.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showAttendanceModal = false" class="btn btn-secondary">{{ i18n.t('action.cancel') }}</button>
            <button (click)="applyAttendance()" class="btn btn-primary">Confirm & Recalculate</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .games-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title { font-size: 2rem; font-weight: 800; color: #FFFFFF; }
    .page-desc { color: #94A3B8; font-size: 0.95rem; }
    .filter-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.75rem;
    }
    .filter-tab {
      background: transparent;
      border: 1px solid transparent;
      color: #94A3B8;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .filter-tab.active {
      background: rgba(163, 230, 53, 0.15);
      border-color: rgba(163, 230, 53, 0.3);
      color: #A3E635;
    }
    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }
    .game-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .game-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(163, 230, 53, 0.12);
      border: 1px solid rgba(163, 230, 53, 0.3);
      border-radius: 10px;
      padding: 0.35rem 0.65rem;
      min-width: 50px;
    }
    .g-day { font-size: 1.25rem; font-weight: 800; color: #A3E635; line-height: 1; }
    .g-month { font-size: 0.7rem; font-weight: 700; color: #E2E8F0; text-transform: uppercase; }
    .game-status-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; }
    .game-title { font-size: 1.25rem; font-weight: 700; color: #FFFFFF; margin: 0.75rem 0 0.25rem; }
    .game-venue { color: #CBD5E1; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .game-time { color: #94A3B8; font-size: 0.825rem; margin-bottom: 1rem; }
    .cost-breakdown-box {
      background: rgba(14, 21, 36, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #94A3B8;
      margin-bottom: 1rem;
    }
    .cost-row { display: flex; justify-content: space-between; }
    .cost-digit { color: #E2E8F0; font-weight: 600; }
    .total-row {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 0.45rem;
      margin-top: 0.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .total-cost { font-size: 1.15rem; }
    .participants-section { margin-bottom: 1rem; }
    .p-header { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94A3B8; margin-bottom: 0.5rem; }
    .p-share { color: #A3E635; font-weight: 700; }
    .participant-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .p-chip {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 0.25rem 0.65rem;
      font-size: 0.775rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #E2E8F0;
    }
    .chip-dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-green { background: #10B981; }
    .dot-gray { background: #64748B; }
    .absent-chip { opacity: 0.5; text-decoration: line-through; }
    .chip-paid-tag { font-size: 0.65rem; color: #10B981; font-weight: 700; margin-left: 0.2rem; }
    .game-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1rem;
      margin-top: 0.5rem;
    }
    .split-model-tag { font-size: 0.75rem; color: #94A3B8; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .player-checklist {
      max-height: 140px;
      overflow-y: auto;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
      color: #E2E8F0;
    }
    .alert-notice {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #BAE6FD;
      margin-bottom: 1.25rem;
    }
    .attendance-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .attendee-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.85rem;
      background: rgba(14, 21, 36, 0.7);
      border-radius: 8px;
    }
    .attend-toggle { display: flex; align-items: center; gap: 0.65rem; cursor: pointer; color: #FFFFFF; font-weight: 600; }
    .financial-impact-card {
      background: rgba(163, 230, 53, 0.08);
      border: 1px solid rgba(163, 230, 53, 0.2);
      border-radius: 10px;
      padding: 1rem;
    }
    .financial-impact-card h4 { font-size: 0.95rem; margin-bottom: 0.5rem; color: #FFFFFF; }
    .impact-metrics { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .impact-col { font-size: 0.85rem; color: #CBD5E1; }
    .reconcile-check { font-size: 0.75rem; color: #A3E635; }
  `]
})
export class GamesComponent implements OnInit {
  games: Game[] = [];
  allPlayers: Player[] = [];
  filterStatus = 'ALL';

  showCreateModal = false;
  showAttendanceModal = false;
  selectedGame: Game | null = null;
  attendanceMap: Record<string, boolean> = {};

  newGame = {
    title: '',
    courtName: 'Star Badminton Arena, Court 3',
    location: 'Gachibowli, Hyderabad',
    gameDate: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '08:00',
    courtBookingCost: 600,
    shuttlecockExpenses: 240,
    additionalExpenses: 0,
    organizerPlayerId: 'player-001',
    notes: ''
  };
  selectedPlayerIds: string[] = [];

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.loadGames();
    this.dataService.getPlayers().subscribe(p => {
      this.allPlayers = p;
      this.selectedPlayerIds = p.slice(0, 6).map(x => x.id);
    });
  }

  loadGames() {
    this.dataService.getGames().subscribe(games => this.games = games);
  }

  get filteredGames(): Game[] {
    if (this.filterStatus === 'ALL') return this.games;
    return this.games.filter(g => g.status === this.filterStatus);
  }

  getCount(status: string): number {
    return this.games.filter(g => g.status === status).length;
  }

  getDay(dateStr: string): string {
    return dateStr ? dateStr.split('-')[2] : '28';
  }

  getMonth(dateStr: string): string {
    if (!dateStr) return 'OCT';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const idx = parseInt(dateStr.split('-')[1], 10) - 1;
    return months[idx] || 'OCT';
  }

  getAttendedCount(game: Game): number {
    return game.participants.filter(p => p.attended).length;
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  togglePlayerSelection(id: string) {
    if (this.selectedPlayerIds.includes(id)) {
      this.selectedPlayerIds = this.selectedPlayerIds.filter(x => x !== id);
    } else {
      this.selectedPlayerIds.push(id);
    }
  }

  saveGame() {
    if (!this.newGame.title || !this.newGame.courtName) {
      alert('Please fill out the game title and court name.');
      return;
    }
    const payload = {
      ...this.newGame,
      participantPlayerIds: this.selectedPlayerIds
    };
    this.dataService.createGame(payload).subscribe(() => {
      this.showCreateModal = false;
      this.loadGames();
    });
  }

  openAttendanceModal(game: Game) {
    this.selectedGame = game;
    this.attendanceMap = {};
    game.participants.forEach(p => {
      this.attendanceMap[p.playerId] = p.attended;
    });
    this.showAttendanceModal = true;
  }

  calculateSelectedAttendeesCount(): number {
    return Object.values(this.attendanceMap).filter(Boolean).length || 1;
  }

  calculateNewPerPlayerShare(): number {
    if (!this.selectedGame) return 0;
    const count = this.calculateSelectedAttendeesCount();
    return +(this.selectedGame.totalCost / count).toFixed(2);
  }

  applyAttendance() {
    if (!this.selectedGame) return;
    const attendedIds = Object.keys(this.attendanceMap).filter(k => this.attendanceMap[k]);
    this.dataService.updateAttendance(this.selectedGame.id, attendedIds).subscribe(() => {
      this.showAttendanceModal = false;
      this.loadGames();
    });
  }
}
