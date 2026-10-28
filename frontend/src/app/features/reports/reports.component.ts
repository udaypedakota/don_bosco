import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { PlayerFinancialStatement, Game, CategoryExpensePoint } from '../../core/models/smash.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="page-title">{{ i18n.t('nav.reports') }}</h1>
          <p class="page-desc">Comprehensive badminton financial audits, player account statements, category distributions, and CSV data exports.</p>
        </div>
        <div class="header-actions">
          <div class="export-btn-group">
            <button (click)="dataService.downloadCsv('games')" class="btn btn-outline btn-sm">
              <span>📥 Export Games CSV</span>
            </button>
            <button (click)="dataService.downloadCsv('payments')" class="btn btn-outline btn-sm">
              <span>📥 Export Payments CSV</span>
            </button>
            <button (click)="dataService.downloadCsv('player-statements')" class="btn btn-primary btn-sm">
              <span>📥 Export Player Statements CSV</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Expense Categories Distribution Card -->
      <div class="card category-card">
        <div class="card-header">
          <h3 class="card-title">🏸 {{ i18n.t('report.categoryBreakdown') }}</h3>
          <span class="badge badge-completed">Club Spending Allocation</span>
        </div>

        <div class="category-bars">
          <div class="cat-item" *ngFor="let cat of categories">
            <div class="cat-header">
              <span class="cat-name">{{ cat.category }}</span>
              <span class="cat-vals"><strong>₹{{ cat.amount }}</strong> ({{ cat.percentage }}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="cat.percentage" [class.court-fill]="cat.category.includes('Court')" [class.shuttle-fill]="cat.category.includes('Shuttle')" [class.misc-fill]="cat.category.includes('Refresh')"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Financial Statements Table -->
      <div class="card statements-card">
        <div class="card-header">
          <h3 class="card-title">👥 {{ i18n.t('report.playerStatements') }}</h3>
          <span class="badge badge-completed">Live Account Ledgers</span>
        </div>

        <div class="table-responsive">
          <table class="report-table">
            <thead>
              <tr>
                <th>Player ID</th>
                <th>Player Name</th>
                <th>Sessions Played</th>
                <th>Total Expense Share</th>
                <th>Total Paid (INR)</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of statements">
                <td class="font-bold text-lime">{{ s.uniquePlayerId }}</td>
                <td class="font-bold text-white">{{ s.playerName }}</td>
                <td>{{ s.gamesPlayed }} Games</td>
                <td class="font-bold text-white">₹{{ s.totalShare }}</td>
                <td class="font-bold text-success">₹{{ s.totalPaid }}</td>
                <td class="font-bold" [class.text-danger]="s.outstandingBalance > 0" [class.text-success]="s.outstandingBalance === 0">
                  ₹{{ s.outstandingBalance }}
                </td>
                <td>
                  <span class="badge" [class.badge-paid]="s.outstandingBalance === 0" [class.badge-pending]="s.outstandingBalance > 0">
                    {{ s.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Searchable Game History -->
      <div class="card history-card">
        <div class="card-header">
          <h3 class="card-title">🔍 Searchable Game History</h3>
          <div class="search-box">
            <input type="text" [(ngModel)]="searchQuery" [placeholder]="i18n.t('report.searchPlaceholder')" class="form-control search-input" />
          </div>
        </div>

        <div class="table-responsive">
          <table class="report-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Court Venue</th>
                <th>Date</th>
                <th>Organizer</th>
                <th>Cost</th>
                <th>Participants</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of filteredGames">
                <td class="font-bold text-white">{{ g.title }}</td>
                <td class="text-secondary">{{ g.courtName }}</td>
                <td>{{ g.gameDate }} ({{ g.startTime }})</td>
                <td class="text-secondary">{{ g.organizerName }}</td>
                <td class="font-bold text-lime">₹{{ g.totalCost }}</td>
                <td>{{ g.participants.length }} players</td>
                <td>
                  <span class="badge" [class.badge-completed]="g.status === 'COMPLETED'" [class.badge-scheduled]="g.status === 'SCHEDULED'">
                    {{ g.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
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
    .export-btn-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .category-bars { display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem; }
    .cat-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .cat-header { display: flex; justify-content: space-between; font-size: 0.9rem; color: #CBD5E1; }
    .progress-track {
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill { height: 100%; border-radius: 9999px; transition: width 0.6s ease; }
    .court-fill { background: linear-gradient(to right, #84CC16, #A3E635); }
    .shuttle-fill { background: linear-gradient(to right, #0284c7, #38BDF8); }
    .misc-fill { background: linear-gradient(to right, #d97706, #F59E0B); }

    .report-table { width: 100%; border-collapse: collapse; }
    .report-table th {
      padding: 1rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .report-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.925rem;
    }
    .search-input { min-width: 320px; font-size: 0.875rem; }
  `]
})
export class ReportsComponent implements OnInit {
  statements: PlayerFinancialStatement[] = [];
  games: Game[] = [];
  categories: CategoryExpensePoint[] = [
    { category: 'Court Booking', amount: 1800, percentage: 72.5 },
    { category: 'Shuttlecock Expenses', amount: 600, percentage: 24.2 },
    { category: 'Refreshments & Hydration', amount: 80, percentage: 3.3 }
  ];
  searchQuery = '';

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.dataService.getPlayerStatements().subscribe(s => this.statements = s);
    this.dataService.getGames().subscribe(g => this.games = g);
  }

  get filteredGames(): Game[] {
    if (!this.searchQuery.trim()) return this.games;
    const q = this.searchQuery.toLowerCase();
    return this.games.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.courtName.toLowerCase().includes(q) ||
      g.organizerName.toLowerCase().includes(q) ||
      g.gameDate.includes(q)
    );
  }
}
