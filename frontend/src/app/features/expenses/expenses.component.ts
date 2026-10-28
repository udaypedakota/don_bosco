import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { Game, SplitType, SplitAllocationPreview } from '../../core/models/smash.models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expenses-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.expenses') }}</h1>
          <p class="page-desc">Precision decimal expense allocation engine with exact penny remainder reconciliation.</p>
        </div>
      </div>

      <!-- Session Selection & Split Model Config -->
      <div class="card config-card">
        <div class="config-grid">
          <div class="form-group flex-2">
            <label class="form-label">Select Badminton Session</label>
            <select [(ngModel)]="selectedGameId" (change)="onGameSelect()" class="form-control form-select">
              <option *ngFor="let g of games" [value]="g.id">
                {{ g.title }} — {{ g.gameDate }} (Total: ₹{{ g.totalCost }})
              </option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Total Expense (INR)</label>
            <div class="total-display-box">
              <span class="currency-symbol">₹</span>
              <span class="total-num">{{ selectedGame?.totalCost || 0 }}</span>
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Actual Attendees</label>
            <div class="attendees-badge-box">
              <span class="att-count">{{ preview?.participantCount || 6 }} Players</span>
              <span class="att-sub">Attended Court</span>
            </div>
          </div>
        </div>

        <!-- Split Model Selector Tabs -->
        <div class="split-model-selector">
          <span class="selector-lbl">Choose Allocation Model:</span>
          <div class="model-buttons">
            <button class="model-btn" [class.active]="selectedSplitType === 'EQUAL'" (click)="setSplitType('EQUAL')">
              <span class="btn-icon">⚖️</span>
              <div class="btn-text">
                <span class="m-title">{{ i18n.t('split.equal') }}</span>
                <span class="m-desc">Even split with penny reconciliation</span>
              </div>
            </button>

            <button class="model-btn" [class.active]="selectedSplitType === 'CUSTOM_FIXED'" (click)="setSplitType('CUSTOM_FIXED')">
              <span class="btn-icon">💵</span>
              <div class="btn-text">
                <span class="m-title">{{ i18n.t('split.customFixed') }}</span>
                <span class="m-desc">Custom fixed amounts in ₹</span>
              </div>
            </button>

            <button class="model-btn" [class.active]="selectedSplitType === 'CUSTOM_PERCENTAGE'" (click)="setSplitType('CUSTOM_PERCENTAGE')">
              <span class="btn-icon">📊</span>
              <div class="btn-text">
                <span class="m-title">{{ i18n.t('split.customPercentage') }}</span>
                <span class="m-desc">Custom % shares summing to 100%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Live Split Allocations Table -->
      <div class="card allocation-card" *ngIf="preview">
        <div class="card-header">
          <h3 class="card-title">🧮 {{ i18n.t('split.preview') }}</h3>
          <span class="badge" [class.badge-paid]="preview.reconciled" [class.badge-pending]="!preview.reconciled">
            {{ preview.reconciled ? '✓ 100% Reconciled' : '⚠️ Allocation Mismatch' }}
          </span>
        </div>

        <div class="table-responsive">
          <table class="allocation-table">
            <thead>
              <tr>
                <th>Player</th>
                <th *ngIf="selectedSplitType === 'CUSTOM_FIXED'">Custom Amount (₹)</th>
                <th *ngIf="selectedSplitType === 'CUSTOM_PERCENTAGE'">Custom Share (%)</th>
                <th>Calculated Share (₹)</th>
                <th>Share %</th>
                <th>Impact vs Previous</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of preview.shares; let i = index">
                <td class="player-cell">
                  <div class="player-tag">
                    <span class="avatar-circle">{{ s.playerName.substring(0, 1) }}</span>
                    <span class="player-title">{{ s.playerName }}</span>
                  </div>
                </td>

                <!-- Custom Fixed Input -->
                <td *ngIf="selectedSplitType === 'CUSTOM_FIXED'">
                  <div class="input-wrap">
                    <span class="p-prefix">₹</span>
                    <input type="number" [(ngModel)]="customFixedValues[s.playerId]" (input)="onCustomFixedChange()" class="form-control num-input" />
                  </div>
                </td>

                <!-- Custom Percentage Input -->
                <td *ngIf="selectedSplitType === 'CUSTOM_PERCENTAGE'">
                  <div class="input-wrap">
                    <input type="number" [(ngModel)]="customPctValues[s.playerId]" (input)="onCustomPctChange()" class="form-control num-input" />
                    <span class="p-suffix">%</span>
                  </div>
                </td>

                <td class="share-cell text-lime font-bold">
                  ₹{{ s.shareAmount }}
                </td>
                <td class="pct-cell text-secondary">
                  {{ s.percentage }}%
                </td>
                <td class="impact-cell">
                  <span class="impact-badge" [class.impact-plus]="(s.difference || 0) > 0" [class.impact-minus]="(s.difference || 0) < 0" [class.impact-zero]="(s.difference || 0) === 0">
                    {{ (s.difference || 0) > 0 ? '+₹' + s.difference : (s.difference || 0) < 0 ? '-₹' + (s.difference! * -1) : '₹0.00' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Reconciliation Footer Summary Bar -->
        <div class="reconcile-footer">
          <div class="reconcile-stats">
            <div class="r-stat">
              <span class="r-lbl">Session Total:</span>
              <span class="r-val">₹{{ preview.totalExpense }}</span>
            </div>
            <div class="r-stat">
              <span class="r-lbl">Total Allocated:</span>
              <span class="r-val text-lime">₹{{ preview.totalAllocated }}</span>
            </div>
            <div class="r-stat">
              <span class="r-lbl">Remainder Adjustment:</span>
              <span class="r-val text-secondary">₹{{ preview.roundingAdjustment }}</span>
            </div>
          </div>

          <div class="reconcile-actions">
            <span class="reconcile-msg" *ngIf="preview.reconciled">
              🛡️ {{ i18n.t('split.reconciledNotice') }}
            </span>
            <span class="reconcile-error" *ngIf="!preview.reconciled">
              ⚠️ Sum of shares does not match total ₹{{ preview.totalExpense }}.
            </span>
            <button (click)="confirmSplit()" [disabled]="!preview.reconciled || isApplying" class="btn btn-primary">
              <span>{{ isApplying ? 'Applying...' : '✓ Confirm & Apply to Dues' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expenses-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-title { font-size: 2rem; font-weight: 800; color: #FFFFFF; }
    .page-desc { color: #94A3B8; font-size: 0.95rem; }
    .config-card { padding: 1.75rem; }
    .config-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 800px) {
      .config-grid { grid-template-columns: 1fr; }
    }
    .total-display-box {
      background: rgba(14, 21, 36, 0.8);
      border: 1px solid rgba(163, 230, 53, 0.3);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .currency-symbol { font-size: 1.15rem; color: #A3E635; font-weight: 700; }
    .total-num { font-size: 1.6rem; font-weight: 800; color: #FFFFFF; }
    .attendees-badge-box {
      background: rgba(14, 21, 36, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
    }
    .att-count { font-size: 1.35rem; font-weight: 800; color: #38BDF8; line-height: 1.1; }
    .att-sub { font-size: 0.725rem; color: #94A3B8; }

    .split-model-selector {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .selector-lbl { font-size: 0.85rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .model-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .model-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(14, 21, 36, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    .model-btn:hover {
      background: rgba(22, 32, 50, 0.9);
      border-color: rgba(163, 230, 53, 0.3);
    }
    .model-btn.active {
      background: rgba(163, 230, 53, 0.12);
      border-color: #A3E635;
      box-shadow: 0 0 20px rgba(163, 230, 53, 0.15);
    }
    .btn-icon { font-size: 1.75rem; }
    .m-title { font-size: 0.95rem; font-weight: 700; color: #FFFFFF; display: block; }
    .m-desc { font-size: 0.775rem; color: #94A3B8; display: block; }

    .allocation-table { width: 100%; border-collapse: collapse; }
    .allocation-table th {
      padding: 1rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .allocation-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.95rem;
    }
    .player-tag { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1e293b;
      color: #A3E635;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .player-title { font-weight: 700; color: #FFFFFF; }
    .input-wrap { display: flex; align-items: center; gap: 0.4rem; max-width: 140px; }
    .num-input { padding: 0.4rem 0.65rem; font-weight: 700; font-size: 0.95rem; text-align: right; }
    .p-prefix, .p-suffix { color: #A3E635; font-weight: 700; }
    .impact-badge {
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .impact-plus { background: rgba(244, 63, 94, 0.12); color: #F43F5E; }
    .impact-minus { background: rgba(16, 185, 129, 0.12); color: #10B981; }
    .impact-zero { background: rgba(255, 255, 255, 0.05); color: #94A3B8; }

    .reconcile-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1.5rem;
      margin-top: 1.5rem;
    }
    .reconcile-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
    .r-stat { display: flex; flex-direction: column; }
    .r-lbl { font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; }
    .r-val { font-size: 1.35rem; font-weight: 800; color: #FFFFFF; }
    .reconcile-actions { display: flex; align-items: center; gap: 1rem; }
    .reconcile-msg { font-size: 0.85rem; color: #10B981; font-weight: 600; }
    .reconcile-error { font-size: 0.85rem; color: #F43F5E; font-weight: 600; }
  `]
})
export class ExpensesComponent implements OnInit {
  games: Game[] = [];
  selectedGameId = '';
  selectedGame: Game | null = null;
  selectedSplitType: SplitType = 'EQUAL';
  preview: SplitAllocationPreview | null = null;
  isApplying = false;

  customFixedValues: Record<string, number> = {};
  customPctValues: Record<string, number> = {};

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.dataService.getGames().subscribe(games => {
      this.games = games;
      if (games.length > 0) {
        this.selectedGameId = games[0].id;
        this.onGameSelect();
      }
    });
  }

  onGameSelect() {
    this.selectedGame = this.games.find(g => g.id === this.selectedGameId) || this.games[0];
    this.calculateCurrentSplit();
  }

  setSplitType(type: SplitType) {
    this.selectedSplitType = type;
    this.calculateCurrentSplit();
  }

  calculateCurrentSplit() {
    if (!this.selectedGame) return;
    const attended = this.selectedGame.participants.filter(p => p.attended);
    const count = attended.length || 1;

    if (this.selectedSplitType === 'EQUAL') {
      this.dataService.previewSplit(this.selectedGame.id, 'EQUAL').subscribe(p => this.preview = p);
    } else if (this.selectedSplitType === 'CUSTOM_FIXED') {
      const base = +(this.selectedGame.totalCost / count).toFixed(2);
      attended.forEach(p => {
        if (!this.customFixedValues[p.playerId]) {
          this.customFixedValues[p.playerId] = base;
        }
      });
      this.onCustomFixedChange();
    } else if (this.selectedSplitType === 'CUSTOM_PERCENTAGE') {
      const basePct = +(100 / count).toFixed(2);
      attended.forEach(p => {
        if (!this.customPctValues[p.playerId]) {
          this.customPctValues[p.playerId] = basePct;
        }
      });
      this.onCustomPctChange();
    }
  }

  onCustomFixedChange() {
    if (!this.selectedGame) return;
    const allocations = this.selectedGame.participants.filter(p => p.attended).map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      customFixedAmount: Number(this.customFixedValues[p.playerId] || 0)
    }));

    const sum = allocations.reduce((acc, a) => acc + a.customFixedAmount, 0);
    this.preview = {
      gameId: this.selectedGame.id,
      totalExpense: this.selectedGame.totalCost,
      splitType: 'CUSTOM_FIXED',
      participantCount: allocations.length,
      shares: allocations.map(a => ({
        playerId: a.playerId,
        playerName: a.playerName,
        shareAmount: a.customFixedAmount,
        percentage: +((a.customFixedAmount / (this.selectedGame?.totalCost || 1)) * 100).toFixed(2)
      })),
      totalAllocated: sum,
      roundingAdjustment: +(this.selectedGame.totalCost - sum).toFixed(2),
      reconciled: Math.abs(this.selectedGame.totalCost - sum) < 0.01
    };
  }

  onCustomPctChange() {
    if (!this.selectedGame) return;
    const allocations = this.selectedGame.participants.filter(p => p.attended).map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      customPercentage: Number(this.customPctValues[p.playerId] || 0)
    }));

    const sumPct = allocations.reduce((acc, a) => acc + a.customPercentage, 0);
    const shares = allocations.map(a => {
      const share = +((this.selectedGame!.totalCost * a.customPercentage) / 100).toFixed(2);
      return {
        playerId: a.playerId,
        playerName: a.playerName,
        shareAmount: share,
        percentage: a.customPercentage
      };
    });
    const sumAllocated = shares.reduce((acc, s) => acc + s.shareAmount, 0);

    this.preview = {
      gameId: this.selectedGame.id,
      totalExpense: this.selectedGame.totalCost,
      splitType: 'CUSTOM_PERCENTAGE',
      participantCount: allocations.length,
      shares,
      totalAllocated: sumAllocated,
      roundingAdjustment: +(this.selectedGame.totalCost - sumAllocated).toFixed(2),
      reconciled: Math.abs(sumPct - 100.0) < 0.01 && Math.abs(this.selectedGame.totalCost - sumAllocated) < 0.05
    };
  }

  confirmSplit() {
    if (!this.preview || !this.preview.reconciled) return;
    if (confirm(`Confirm and apply ${this.selectedSplitType} expense split of ₹${this.preview.totalExpense} across ${this.preview.participantCount} players?`)) {
      this.isApplying = true;
      this.dataService.confirmSplit({
        gameId: this.preview.gameId,
        splitType: this.selectedSplitType,
        allocations: this.preview.shares
      }).subscribe(() => {
        this.isApplying = false;
        alert('Expense split confirmed and applied to player accounts successfully!');
      });
    }
  }
}
