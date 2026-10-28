import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { SettlementSummary, SimplifiedDebt } from '../../core/models/smash.models';

@Component({
  selector: 'app-settlements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settlements-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.settlements') }}</h1>
          <p class="page-desc">Automatic cash flow minimization & debt simplification showing who owes whom and organizer advance recoveries.</p>
        </div>
      </div>

      <!-- Financial Balance Overview Cards -->
      <div class="balance-grid">
        <div class="card bal-card">
          <span class="b-lbl">Total Court & Group Costs</span>
          <h2 class="b-val text-white">₹{{ summary?.totalGroupExpenses || 840 }}</h2>
          <span class="b-sub">All Session Expenses</span>
        </div>

        <div class="card bal-card">
          <span class="b-lbl">Organizer Upfront Advance</span>
          <h2 class="b-val text-lime">₹{{ summary?.totalGroupExpenses || 840 }}</h2>
          <span class="b-sub">Paid Upfront by Vikram Rao</span>
        </div>

        <div class="card bal-card">
          <span class="b-lbl">Recovered via UPI/Cash</span>
          <h2 class="b-val text-success">₹{{ summary?.totalPaymentsCollected || 240 }}</h2>
          <span class="b-sub">Reimbursed to Organizer</span>
        </div>

        <div class="card bal-card">
          <span class="b-lbl">Remaining Unsettled Dues</span>
          <h2 class="b-val text-danger">₹{{ summary?.totalOutstandingBalance || 600 }}</h2>
          <span class="b-sub">Collectively Owed to Organizer</span>
        </div>
      </div>

      <!-- Who Owes Whom Cards (Debt Simplification) -->
      <div class="card debts-card">
        <div class="card-header">
          <h3 class="card-title">🤝 {{ i18n.t('settlement.whoOwesWhom') }}</h3>
          <span class="badge badge-pending">{{ summary?.simplifiedDebts?.length || 0 }} Transfers Required</span>
        </div>
        <p class="section-subtext">Our debt simplification algorithm calculates minimal transactions so players don't have to exchange money in circles.</p>

        <div class="debts-grid">
          <div class="debt-box card" *ngFor="let debt of summary?.simplifiedDebts">
            <div class="debt-header">
              <div class="player-avatar-badge">{{ debt.fromPlayerName.substring(0,2).toUpperCase() }}</div>
              <div class="debt-arrow">➔</div>
              <div class="player-avatar-badge org-badge">{{ debt.toPlayerName.substring(0,2).toUpperCase() }}</div>
            </div>

            <div class="debt-info">
              <div class="payer-title">{{ debt.fromPlayerName }}</div>
              <div class="owes-text">{{ i18n.t('settlement.owes') }}</div>
              <div class="payee-title">{{ debt.toPlayerName }}</div>
            </div>

            <div class="debt-amount text-danger">
              ₹{{ debt.amount }}
            </div>

            <button (click)="openSettleModal(debt)" class="btn btn-outline btn-sm settle-btn">
              <span>⚡ {{ i18n.t('action.settleNow') }}</span>
            </button>
          </div>

          <div class="all-cleared-box card" *ngIf="!summary?.simplifiedDebts?.length">
            <span class="cleared-icon">🎉</span>
            <h3>All Settled!</h3>
            <p>{{ i18n.t('settlement.allSettled') }}</p>
          </div>
        </div>
      </div>

      <!-- Net Balance Matrix for all Players -->
      <div class="card matrix-card">
        <div class="card-header">
          <h3 class="card-title">📊 Individual Player Net Balances</h3>
          <span class="badge badge-completed">7 Smash Club Players</span>
        </div>

        <div class="table-responsive">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Net Balance Status</th>
                <th>Net Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of summary?.netBalances">
                <td class="font-bold text-white">{{ b.playerName }}</td>
                <td>
                  <span class="badge" [class.badge-paid]="b.netBalance > 0" [class.badge-pending]="b.netBalance < 0" [class.badge-completed]="b.netBalance === 0">
                    {{ b.statusText }}
                  </span>
                </td>
                <td class="font-bold" [class.text-success]="b.netBalance > 0" [class.text-danger]="b.netBalance < 0" [class.text-secondary]="b.netBalance === 0">
                  {{ b.netBalance > 0 ? '+₹' + b.netBalance : b.netBalance < 0 ? '-₹' + (b.netBalance * -1) : '₹0.00' }}
                </td>
                <td>
                  <span *ngIf="b.netBalance === 0" class="text-secondary text-sm">Settled</span>
                  <span *ngIf="b.netBalance > 0" class="text-success text-sm font-bold">Organizer Advance</span>
                  <button *ngIf="b.netBalance < 0" (click)="quickSettlePlayer(b)" class="btn btn-secondary btn-sm">
                    Clear Dues
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SETTLE MODAL -->
      <div class="modal-backdrop" *ngIf="showSettleModal && activeDebt">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>🤝 Settle Balance via UPI</h3>
            <button (click)="showSettleModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1.25rem; color: #CBD5E1;">
              Recording payment of <strong>₹{{ activeDebt.amount }}</strong> from <strong>{{ activeDebt.fromPlayerName }}</strong> to <strong>{{ activeDebt.toPlayerName }}</strong>:
            </p>

            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select [(ngModel)]="settleMethod" class="form-control form-select">
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">UPI Transaction Reference (UTR)</label>
              <input type="text" [(ngModel)]="settleUtr" class="form-control" placeholder="e.g. UPI872635419283" />
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showSettleModal = false" class="btn btn-secondary">{{ i18n.t('action.cancel') }}</button>
            <button (click)="confirmSettlement()" class="btn btn-primary">{{ i18n.t('action.confirm') }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settlements-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-title { font-size: 2rem; font-weight: 800; color: #FFFFFF; }
    .page-desc { color: #94A3B8; font-size: 0.95rem; }
    .balance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .bal-card { padding: 1.5rem; }
    .b-lbl { font-size: 0.775rem; text-transform: uppercase; color: #94A3B8; font-weight: 700; margin-bottom: 0.25rem; display: block; }
    .b-val { font-size: 2rem; font-weight: 800; line-height: 1.1; margin-bottom: 0.25rem; }
    .b-sub { font-size: 0.75rem; color: #64748B; }

    .debts-card { padding: 1.75rem; }
    .section-subtext { color: #94A3B8; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .debts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .debt-box {
      background: rgba(14, 21, 36, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
      transition: all 0.25s ease;
    }
    .debt-box:hover {
      border-color: rgba(244, 63, 94, 0.4);
      transform: translateY(-2px);
    }
    .debt-header { display: flex; align-items: center; gap: 0.85rem; }
    .player-avatar-badge {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1e293b;
      color: #38BDF8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
      border: 2px solid rgba(56, 189, 248, 0.4);
    }
    .org-badge {
      color: #A3E635;
      border-color: rgba(163, 230, 53, 0.5);
      background: rgba(163, 230, 53, 0.12);
    }
    .debt-arrow { font-size: 1.25rem; color: #64748B; }
    .debt-info { line-height: 1.3; }
    .payer-title { font-size: 1.1rem; font-weight: 800; color: #FFFFFF; }
    .owes-text { font-size: 0.775rem; color: #94A3B8; text-transform: uppercase; margin: 0.2rem 0; }
    .payee-title { font-size: 1.1rem; font-weight: 800; color: #A3E635; }
    .debt-amount { font-size: 1.85rem; font-weight: 900; }
    .settle-btn { width: 100%; }

    .matrix-table { width: 100%; border-collapse: collapse; }
    .matrix-table th {
      padding: 1rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .matrix-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.95rem;
    }
    .all-cleared-box {
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;
      color: #10B981;
    }
    .cleared-icon { font-size: 3rem; margin-bottom: 0.5rem; display: block; }
  `]
})
export class SettlementsComponent implements OnInit {
  summary: SettlementSummary | null = null;
  showSettleModal = false;
  activeDebt: SimplifiedDebt | null = null;
  settleMethod = 'UPI';
  settleUtr = '';

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.loadSettlements();
  }

  loadSettlements() {
    this.dataService.getSettlementSummary().subscribe(s => this.summary = s);
  }

  openSettleModal(debt: SimplifiedDebt) {
    this.activeDebt = debt;
    this.settleUtr = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
    this.showSettleModal = true;
  }

  quickSettlePlayer(b: any) {
    this.openSettleModal({
      fromPlayerId: b.playerId,
      fromPlayerName: b.playerName,
      toPlayerId: 'player-001',
      toPlayerName: 'Vikram Rao',
      amount: Math.abs(b.netBalance)
    });
  }

  confirmSettlement() {
    if (!this.activeDebt) return;
    this.dataService.resolveSettlement({
      fromPlayerId: this.activeDebt.fromPlayerId,
      toPlayerId: this.activeDebt.toPlayerId,
      amount: this.activeDebt.amount,
      paymentMethod: this.settleMethod,
      transactionReference: this.settleUtr,
      notes: 'Cleared through Settlement Hub'
    }).subscribe(() => {
      this.showSettleModal = false;
      this.loadSettlements();
      alert(`Settlement of ₹${this.activeDebt?.amount} recorded and cleared!`);
    });
  }
}
