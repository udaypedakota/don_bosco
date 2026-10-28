import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { Player } from '../../core/models/smash.models';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="players-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.players') }}</h1>
          <p class="page-desc">Manage Smash Club badminton roster, member profiles, invitation links, and individual player financial summaries.</p>
        </div>
        <div class="header-actions" *ngIf="auth.isAdmin()">
          <button (click)="openAddModal()" class="btn btn-primary">
            <span>➕ {{ i18n.t('action.addPlayer') }}</span>
          </button>
        </div>
      </div>

      <!-- Player Statistics Summary Banner -->
      <div class="roster-summary card">
        <div class="summary-col">
          <span class="sum-label">Total Roster</span>
          <span class="sum-val">{{ players.length }} Players</span>
        </div>
        <div class="summary-col">
          <span class="sum-label">Active Members</span>
          <span class="sum-val text-lime">{{ getActiveCount() }} Active</span>
        </div>
        <div class="summary-col">
          <span class="sum-label">Total Group Dues</span>
          <span class="sum-val text-danger">₹{{ getTotalDues() }}</span>
        </div>
        <div class="summary-col">
          <span class="sum-label">Initial Cohort</span>
          <span class="sum-val">7 Core Players</span>
        </div>
      </div>

      <!-- Players Grid -->
      <div class="players-grid">
        <div class="player-card card" *ngFor="let p of players" [class.inactive-card]="!p.active">
          <div class="player-header">
            <div class="avatar-wrap">
              <img [src]="p.avatarUrl" [alt]="p.name" class="player-photo" />
              <span class="online-indicator" [class.bg-green]="p.active" [class.bg-gray]="!p.active"></span>
            </div>
            <div class="player-identifiers">
              <div class="id-row">
                <span class="unique-id-tag">{{ p.uniquePlayerId }}</span>
                <span class="badge" [class.badge-paid]="p.active" [class.badge-cancelled]="!p.active">
                  {{ p.active ? i18n.t('player.active') : i18n.t('player.inactive') }}
                </span>
              </div>
              <h3 class="player-name">{{ p.name }}</h3>
              <span class="player-role-sub">{{ p.notes || 'Club Member' }}</span>
            </div>
          </div>

          <div class="player-body">
            <div class="contact-info">
              <div class="contact-item">
                <span class="icon">📱</span>
                <span>+91 {{ p.mobileNumber }}</span>
              </div>
              <div class="contact-item">
                <span class="icon">✉️</span>
                <span>{{ p.email }}</span>
              </div>
              <div class="contact-item">
                <span class="icon">📅</span>
                <span>Joined: {{ p.joinDate }}</span>
              </div>
            </div>

            <!-- Financial Summary Box -->
            <div class="financial-summary-box">
              <span class="f-box-title">{{ i18n.t('player.financialSummary') }}</span>
              <div class="f-metrics-grid">
                <div class="f-metric">
                  <span class="f-lbl">Games</span>
                  <span class="f-val">{{ p.totalGamesPlayed }}</span>
                </div>
                <div class="f-metric">
                  <span class="f-lbl">Total Share</span>
                  <span class="f-val text-lime">₹{{ p.totalExpenseShare }}</span>
                </div>
                <div class="f-metric">
                  <span class="f-lbl">Total Paid</span>
                  <span class="f-val text-success">₹{{ p.totalPaid }}</span>
                </div>
                <div class="f-metric">
                  <span class="f-lbl">Balance</span>
                  <span class="f-val" [class.text-danger]="p.outstandingBalance > 0" [class.text-success]="p.outstandingBalance === 0">
                    ₹{{ p.outstandingBalance }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="player-footer" *ngIf="auth.isAdmin()">
            <button (click)="openInviteModal(p)" class="btn btn-outline btn-sm">
              <span>🔗 {{ i18n.t('action.invite') }}</span>
            </button>
            <button (click)="togglePlayerStatus(p)" class="btn btn-secondary btn-sm" [class.btn-danger]="p.active">
              {{ p.active ? i18n.t('action.deactivate') : i18n.t('action.activate') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ADD PLAYER MODAL -->
      <div class="modal-backdrop" *ngIf="showAddModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>👤 Add New Smash Club Player</h3>
            <button (click)="showAddModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" [(ngModel)]="newPlayer.name" class="form-control" placeholder="e.g. Ramesh Chandra" />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Mobile Number (10 digits) *</label>
                <input type="tel" [(ngModel)]="newPlayer.mobileNumber" class="form-control" placeholder="9876543219" maxlength="10" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Email Address</label>
                <input type="email" [(ngModel)]="newPlayer.email" class="form-control" placeholder="player@smashclub.in" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Profile Picture URL (Optional)</label>
              <input type="url" [(ngModel)]="newPlayer.avatarUrl" class="form-control" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label class="form-label">Player Bio / Notes</label>
              <input type="text" [(ngModel)]="newPlayer.notes" class="form-control" placeholder="e.g. Left-handed doubles specialist" />
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showAddModal = false" class="btn btn-secondary">{{ i18n.t('action.cancel') }}</button>
            <button (click)="savePlayer()" class="btn btn-primary">{{ i18n.t('action.save') }}</button>
          </div>
        </div>
      </div>

      <!-- INVITATION MODAL -->
      <div class="modal-backdrop" *ngIf="showInviteModal && selectedPlayer">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🔗 Invite & Activate Account</h3>
            <button (click)="showInviteModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1rem; color: #CBD5E1;">Share this secure invitation link with <strong>{{ selectedPlayer.name }}</strong> (+91 {{ selectedPlayer.mobileNumber }}) to activate their Smash Club player account:</p>
            
            <div class="invite-link-box">
              <input type="text" readonly [value]="getInviteLink(selectedPlayer)" class="form-control link-input" />
              <button (click)="copyInviteLink(selectedPlayer)" class="btn btn-primary">
                {{ copied ? '✓ Copied!' : i18n.t('action.copyLink') }}
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showInviteModal = false" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .players-container {
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
    .roster-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.5rem;
      padding: 1.25rem 2rem;
      background: linear-gradient(135deg, rgba(22, 32, 50, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
    }
    .summary-col { display: flex; flex-direction: column; gap: 0.25rem; }
    .sum-label { font-size: 0.775rem; text-transform: uppercase; color: #94A3B8; font-weight: 600; }
    .sum-val { font-size: 1.5rem; font-weight: 800; color: #FFFFFF; }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .player-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    }
    .inactive-card { opacity: 0.6; filter: grayscale(0.4); }
    .player-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .avatar-wrap { position: relative; }
    .player-photo {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #A3E635;
      box-shadow: 0 0 15px rgba(163, 230, 53, 0.25);
    }
    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #111827;
    }
    .bg-green { background: #10B981; }
    .bg-gray { background: #64748B; }
    .player-identifiers { display: flex; flex-direction: column; flex: 1; }
    .id-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
    .unique-id-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #A3E635;
      background: rgba(163, 230, 53, 0.12);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .player-name { font-size: 1.25rem; font-weight: 800; color: #FFFFFF; line-height: 1.2; }
    .player-role-sub { font-size: 0.8rem; color: #94A3B8; }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.825rem;
      color: #CBD5E1;
      margin-bottom: 1rem;
    }
    .contact-item { display: flex; align-items: center; gap: 0.5rem; }
    .icon { font-size: 0.95rem; }

    .financial-summary-box {
      background: rgba(14, 21, 36, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 0.85rem;
    }
    .f-box-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #94A3B8;
      display: block;
      margin-bottom: 0.65rem;
    }
    .f-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      text-align: center;
    }
    .f-metric { display: flex; flex-direction: column; }
    .f-lbl { font-size: 0.7rem; color: #64748B; margin-bottom: 0.2rem; }
    .f-val { font-size: 0.95rem; font-weight: 800; color: #FFFFFF; }

    .player-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1rem;
      margin-top: 1rem;
    }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .invite-link-box { display: flex; gap: 0.75rem; }
    .link-input { font-family: monospace; font-size: 0.85rem; color: #A3E635; }
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  showAddModal = false;
  showInviteModal = false;
  selectedPlayer: Player | null = null;
  copied = false;

  newPlayer = {
    name: '',
    mobileNumber: '',
    email: '',
    avatarUrl: '',
    notes: ''
  };

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.loadPlayers();
  }

  loadPlayers() {
    this.dataService.getPlayers().subscribe(p => this.players = p);
  }

  getActiveCount(): number {
    return this.players.filter(p => p.active).length;
  }

  getTotalDues(): number {
    return this.players.reduce((sum, p) => sum + p.outstandingBalance, 0);
  }

  openAddModal() {
    this.newPlayer = {
      name: '',
      mobileNumber: '',
      email: '',
      avatarUrl: '',
      notes: ''
    };
    this.showAddModal = true;
  }

  savePlayer() {
    if (!this.newPlayer.name || !this.newPlayer.mobileNumber) {
      alert('Please provide player name and mobile number.');
      return;
    }

    // Validate 10-digit mobile number
    if (!/^[0-9]{10}$/.test(this.newPlayer.mobileNumber)) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    // Duplicate mobile number check
    if (this.players.some(p => p.mobileNumber === this.newPlayer.mobileNumber)) {
      alert('A player with mobile number ' + this.newPlayer.mobileNumber + ' already exists.');
      return;
    }

    this.dataService.createPlayer(this.newPlayer).subscribe(() => {
      this.showAddModal = false;
      this.loadPlayers();
    });
  }

  togglePlayerStatus(p: Player) {
    if (p.active) {
      if (confirm(`Are you sure you want to deactivate ${p.name}?`)) {
        this.dataService.deactivatePlayer(p.id).subscribe(() => this.loadPlayers());
      }
    } else {
      this.dataService.activatePlayer(p.id).subscribe(() => this.loadPlayers());
    }
  }

  openInviteModal(p: Player) {
    this.selectedPlayer = p;
    this.copied = false;
    this.showInviteModal = true;
  }

  getInviteLink(p: Player): string {
    return `${window.location.origin}/activate?token=sc_${p.uniquePlayerId.toLowerCase()}_invite`;
  }

  copyInviteLink(p: Player) {
    const link = this.getInviteLink(p);
    navigator.clipboard.writeText(link);
    this.copied = true;
    setTimeout(() => this.copied = false, 3000);
  }
}
