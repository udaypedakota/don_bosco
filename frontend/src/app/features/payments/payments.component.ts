import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { Payment, Player } from '../../core/models/smash.models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payments-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.payments') }}</h1>
          <p class="page-desc">Track member dues, record full and partial payments, verify UPI UTR references, and manage payment audits.</p>
        </div>
        <div class="header-actions">
          <button (click)="openRecordModal()" class="btn btn-primary">
            <span>💳 {{ i18n.t('action.recordPayment') }}</span>
          </button>
        </div>
      </div>

      <!-- UPI QR Code Showcase Card & Quick Pay Banner -->
      <div class="card upi-showcase-card">
        <div class="upi-details">
          <div class="badge-tag">⚡ INSTANT UPI CLEARANCE • ZERO TRANSACTION FEES</div>
          <h2 class="upi-title">Smash Club Official UPI Hub</h2>
          <p class="upi-desc">Scan via any UPI app (Google Pay, PhonePe, Paytm, CRED) and record your transaction reference (UTR) below for instant verification.</p>
          <div class="upi-id-pill">
            <span class="upi-lbl">Club VPA:</span>
            <span class="upi-vpa">smashclub@okhdfcbank</span>
            <button (click)="copyUpi()" class="copy-upi-btn">{{ upiCopied ? '✓ Copied' : 'Copy VPA' }}</button>
          </div>
        </div>

        <div class="qr-mock-box">
          <div class="qr-frame">
            <!-- Badminton Court Styled QR Visual -->
            <svg class="qr-svg" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="10" fill="#111827" />
              <rect x="10" y="10" width="25" height="25" rx="4" stroke="#A3E635" stroke-width="4" fill="none" />
              <rect x="17" y="17" width="11" height="11" fill="#A3E635" />
              <rect x="65" y="10" width="25" height="25" rx="4" stroke="#A3E635" stroke-width="4" fill="none" />
              <rect x="72" y="17" width="11" height="11" fill="#A3E635" />
              <rect x="10" y="65" width="25" height="25" rx="4" stroke="#A3E635" stroke-width="4" fill="none" />
              <rect x="17" y="72" width="11" height="11" fill="#A3E635" />
              <!-- Data patterns -->
              <circle cx="50" cy="50" r="8" fill="#A3E635" />
              <rect x="42" y="20" width="16" height="5" fill="#38BDF8" />
              <rect x="42" y="75" width="16" height="5" fill="#38BDF8" />
              <rect x="70" y="45" width="20" height="4" fill="#E2E8F0" />
              <rect x="70" y="55" width="15" height="4" fill="#E2E8F0" />
              <rect x="70" y="75" width="20" height="10" fill="#A3E635" />
            </svg>
            <span class="qr-caption">Scan with any UPI App</span>
          </div>
        </div>
      </div>

      <!-- Payment Audit Log & Ledger -->
      <div class="card ledger-card">
        <div class="card-header">
          <h3 class="card-title">📜 Payment History & Audit Ledger</h3>
          <span class="badge badge-completed">{{ payments.length }} Transactions Recorded</span>
        </div>

        <div class="table-responsive">
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Reference No.</th>
                <th>Payer</th>
                <th>Payee (Organizer)</th>
                <th>Amount (₹)</th>
                <th>Method</th>
                <th>UTR / Transaction Ref</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments">
                <td class="ref-col font-bold">{{ p.paymentReferenceNumber }}</td>
                <td class="payer-col font-bold text-white">{{ p.payerPlayerName }}</td>
                <td class="payee-col text-secondary">{{ p.payeePlayerName || 'Club Organizer' }}</td>
                <td class="amount-col font-bold text-success">₹{{ p.amount }}</td>
                <td>
                  <span class="method-tag">{{ p.paymentMethod }}</span>
                </td>
                <td class="utr-col text-secondary">{{ p.transactionReference || '—' }}</td>
                <td class="date-col text-secondary">{{ p.paymentDate }}</td>
                <td>
                  <span class="badge" [class.badge-paid]="p.status === 'PAID'" [class.badge-pending]="p.status === 'PENDING_VERIFICATION'">
                    {{ p.status }}
                  </span>
                </td>
                <td>
                  <span class="text-success font-bold" *ngIf="p.verifiedByAdmin">✓ Verified</span>
                  <button *ngIf="!p.verifiedByAdmin && auth.isAdmin()" (click)="verifyPayment(p)" class="btn btn-outline btn-sm">
                    Approve
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- RECORD PAYMENT MODAL -->
      <div class="modal-backdrop" *ngIf="showRecordModal">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>💳 Record Payment Entry</h3>
            <button (click)="showRecordModal = false" class="btn-icon">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Payer (Player) *</label>
                <select [(ngModel)]="newPayment.payerPlayerId" class="form-control form-select">
                  <option *ngFor="let pl of players" [value]="pl.id">
                    {{ pl.name }} (Dues: ₹{{ pl.outstandingBalance }})
                  </option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Payee (Organizer / Club)</label>
                <select [(ngModel)]="newPayment.payeePlayerId" class="form-control form-select">
                  <option *ngFor="let pl of players" [value]="pl.id">{{ pl.name }}</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Payment Amount (₹) *</label>
                <input type="number" [(ngModel)]="newPayment.amount" class="form-control" placeholder="140" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Payment Method *</label>
                <select [(ngModel)]="newPayment.paymentMethod" class="form-control form-select">
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Reference (UTR Number)</label>
              <input type="text" [(ngModel)]="newPayment.transactionReference" class="form-control" placeholder="e.g. 12-digit UTR 982736451290" />
              <small style="color: #94A3B8; font-size: 0.75rem;">Backend validates uniqueness to prevent duplicate payment submissions.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" [(ngModel)]="newPayment.notes" class="form-control" placeholder="e.g. Cleared dues for Saturday court session" />
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="showRecordModal = false" class="btn btn-secondary">{{ i18n.t('action.cancel') }}</button>
            <button (click)="savePayment()" class="btn btn-primary">{{ i18n.t('action.confirm') }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-title { font-size: 2rem; font-weight: 800; color: #FFFFFF; }
    .page-desc { color: #94A3B8; font-size: 0.95rem; }
    .upi-showcase-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(22, 32, 50, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%);
      border: 1px solid rgba(163, 230, 53, 0.25);
    }
    .badge-tag { font-size: 0.75rem; font-weight: 700; color: #A3E635; letter-spacing: 0.08em; margin-bottom: 0.4rem; }
    .upi-title { font-size: 1.6rem; font-weight: 800; color: #FFFFFF; margin-bottom: 0.4rem; }
    .upi-desc { color: #94A3B8; max-width: 600px; font-size: 0.9rem; margin-bottom: 1.25rem; }
    .upi-id-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(14, 21, 36, 0.8);
      border: 1px solid rgba(163, 230, 53, 0.3);
      border-radius: 30px;
      padding: 0.4rem 1rem;
    }
    .upi-lbl { font-size: 0.8rem; color: #94A3B8; }
    .upi-vpa { font-family: monospace; font-size: 1rem; font-weight: 700; color: #A3E635; }
    .copy-upi-btn {
      background: rgba(163, 230, 53, 0.2);
      border: none;
      color: #A3E635;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      cursor: pointer;
    }
    .qr-frame {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: rgba(14, 21, 36, 0.9);
      border: 2px solid rgba(163, 230, 53, 0.4);
      padding: 1rem;
      border-radius: 18px;
      box-shadow: 0 0 25px rgba(163, 230, 53, 0.15);
    }
    .qr-svg { width: 130px; height: 130px; }
    .qr-caption { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }

    .ledger-table { width: 100%; border-collapse: collapse; }
    .ledger-table th {
      padding: 1rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .ledger-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.9rem;
    }
    .ref-col { font-family: monospace; font-size: 0.825rem; color: #A3E635; }
    .method-tag {
      background: rgba(255, 255, 255, 0.08);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #E2E8F0;
    }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
  `]
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  players: Player[] = [];
  showRecordModal = false;
  upiCopied = false;

  newPayment = {
    payerPlayerId: 'player-003',
    payeePlayerId: 'player-001',
    amount: 140,
    paymentMethod: 'UPI',
    transactionReference: '',
    notes: ''
  };

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.loadPayments();
    this.dataService.getPlayers().subscribe(p => this.players = p);
  }

  loadPayments() {
    this.dataService.getPayments().subscribe(p => this.payments = p);
  }

  openRecordModal() {
    this.showRecordModal = true;
  }

  copyUpi() {
    navigator.clipboard.writeText('smashclub@okhdfcbank');
    this.upiCopied = true;
    setTimeout(() => this.upiCopied = false, 2500);
  }

  savePayment() {
    if (!this.newPayment.amount || this.newPayment.amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    this.dataService.recordPayment(this.newPayment).subscribe(() => {
      this.showRecordModal = false;
      this.loadPayments();
    });
  }

  verifyPayment(p: Payment) {
    p.verifiedByAdmin = true;
    p.status = 'PAID';
    alert(`Payment ${p.paymentReferenceNumber} verified and cleared!`);
  }
}
