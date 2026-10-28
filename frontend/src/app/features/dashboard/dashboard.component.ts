import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SmashDataService } from '../../core/services/smash-data.service';
import { I18nService } from '../../core/services/i18n.service';
import { AdminDashboardStats, PlayerDashboardStats, Game, SettlementSummary } from '../../core/models/smash.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Banner -->
      <div class="welcome-banner card">
        <div class="banner-content">
          <div class="badge-tag">🏸 {{ i18n.t('brand.name') }} • HYDERABAD</div>
          <h1 class="banner-title">
            <span class="text-gradient">Welcome, {{ auth.currentUser()?.playerName }}!</span>
          </h1>
          <p class="banner-desc">
            {{ auth.isAdmin()
              ? 'Complete overview of club expenses, active games, player dues and settlements.'
              : 'Track your badminton game attendance, expense shares, and outstanding payments.' }}
          </p>
        </div>
        <div class="banner-actions">
          <a routerLink="/games" class="btn btn-primary" *ngIf="auth.isAdmin()">
            <span>➕ {{ i18n.t('action.addGame') }}</span>
          </a>
          <a routerLink="/payments" class="btn btn-secondary">
            <span>💳 {{ i18n.t('action.recordPayment') }}</span>
          </a>
          <a routerLink="/settlements" class="btn btn-outline">
            <span>🤝 {{ i18n.t('nav.settlements') }}</span>
          </a>
        </div>
      </div>

      <!-- ADMIN DASHBOARD VIEW -->
      <ng-container *ngIf="auth.isAdmin()">
        <!-- Key Metrics Cards -->
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon-wrapper lime-glow">👥</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.activePlayers') }}</span>
              <h2 class="stat-val">{{ adminStats?.totalActivePlayers || 7 }}</h2>
              <span class="stat-hint">Active Club Members</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper cyan-glow">🏸</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.upcomingGames') }}</span>
              <h2 class="stat-val">{{ adminStats?.upcomingGamesCount || 1 }}</h2>
              <span class="stat-hint">Next: Tomorrow 6:30 AM</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper purple-glow">💰</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.monthlyExpenses') }}</span>
              <h2 class="stat-val text-lime">₹{{ adminStats?.monthlyExpenses || 2480 }}</h2>
              <span class="stat-hint">Court & Shuttles (INR)</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper emerald-glow">✅</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.paymentsCollected') }}</span>
              <h2 class="stat-val text-success">₹{{ adminStats?.paymentsCollected || 1880 }}</h2>
              <span class="stat-hint">UPI & Cash Received</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper rose-glow">⚠️</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.outstandingBalance') }}</span>
              <h2 class="stat-val text-danger">₹{{ adminStats?.outstandingBalance || 600 }}</h2>
              <span class="stat-hint">Pending Player Dues</span>
            </div>
          </div>
        </div>

        <!-- Charts and Activity Section -->
        <div class="dashboard-split">
          <!-- Monthly Trends Visual Bar Chart -->
          <div class="card chart-card">
            <div class="card-header">
              <h3 class="card-title">📊 {{ i18n.t('report.monthlyTrends') }}</h3>
              <span class="badge badge-completed">Last 5 Months</span>
            </div>
            <div class="bar-chart-container">
              <div class="chart-bars">
                <div class="bar-col" *ngFor="let point of adminStats?.monthlyTrends">
                  <div class="bar-stack">
                    <div class="bar-fill expense-bar" [style.height.%]="(point.totalExpense / 3000) * 100" [title]="'Total: ₹' + point.totalExpense"></div>
                    <div class="bar-fill paid-bar" [style.height.%]="(point.totalPaid / 3000) * 100" [title]="'Collected: ₹' + point.totalPaid"></div>
                  </div>
                  <span class="bar-label">{{ point.month }}</span>
                  <span class="bar-val">₹{{ point.totalExpense }}</span>
                </div>
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot dot-expense"></span> Total Expenses</span>
                <span class="legend-item"><span class="legend-dot dot-paid"></span> Payments Collected</span>
              </div>
            </div>
          </div>

          <!-- Who Owes Whom Summary Card -->
          <div class="card settlement-card">
            <div class="card-header">
              <h3 class="card-title">🤝 {{ i18n.t('settlement.whoOwesWhom') }}</h3>
              <a routerLink="/settlements" class="btn btn-outline btn-sm">Full Matrix →</a>
            </div>
            <div class="settlement-list">
              <div class="settle-item" *ngFor="let debt of settlements?.simplifiedDebts">
                <div class="settle-avatars">
                  <span class="avatar-tag">{{ debt.fromPlayerName.substring(0,2).toUpperCase() }}</span>
                  <span class="arrow-indicator">➔</span>
                  <span class="avatar-tag organizer-tag">{{ debt.toPlayerName.substring(0,2).toUpperCase() }}</span>
                </div>
                <div class="settle-details">
                  <span class="debtor-name">{{ debt.fromPlayerName }}</span>
                  <span class="debt-verb">{{ i18n.t('settlement.owes') }}</span>
                  <span class="creditor-name">{{ debt.toPlayerName }}</span>
                </div>
                <div class="settle-amount">
                  <span class="amount-badge">₹{{ debt.amount }}</span>
                </div>
              </div>
              <div class="settle-empty" *ngIf="!settlements?.simplifiedDebts?.length">
                <span>🎉 {{ i18n.t('settlement.allSettled') }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- PLAYER DASHBOARD VIEW -->
      <ng-container *ngIf="!auth.isAdmin()">
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon-wrapper lime-glow">🏸</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.totalGames') }}</span>
              <h2 class="stat-val">{{ playerStats?.gamesAttended || 5 }}</h2>
              <span class="stat-hint">Sessions Played</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper purple-glow">📊</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.myShare') }}</span>
              <h2 class="stat-val text-lime">₹{{ playerStats?.totalExpenseShare || 700 }}</h2>
              <span class="stat-hint">Your Total Allocated Share</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper emerald-glow">💳</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.myPaid') }}</span>
              <h2 class="stat-val text-success">₹{{ playerStats?.totalPaymentsMade || 700 }}</h2>
              <span class="stat-hint">Successfully Settled</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrapper rose-glow">⏳</div>
            <div class="stat-info">
              <span class="stat-label">{{ i18n.t('stat.myBalance') }}</span>
              <h2 class="stat-val" [class.text-danger]="(playerStats?.outstandingBalance || 0) > 0" [class.text-success]="(playerStats?.outstandingBalance || 0) === 0">
                ₹{{ playerStats?.outstandingBalance || 0 }}
              </h2>
              <span class="stat-hint">{{ (playerStats?.outstandingBalance || 0) === 0 ? 'All Settled!' : 'Dues Pending' }}</span>
            </div>
          </div>
        </div>

        <!-- Player Next Session Card -->
        <div class="card upcoming-session-card">
          <div class="card-header">
            <h3 class="card-title">🏸 Next Scheduled Game</h3>
            <span class="badge badge-scheduled">CONFIRMED</span>
          </div>
          <div class="session-info-grid" *ngIf="nextGame">
            <div class="session-main">
              <h4>{{ nextGame.title }}</h4>
              <p class="session-venue">📍 {{ nextGame.courtName }} • {{ nextGame.location }}</p>
              <div class="session-meta">
                <span class="meta-pill">📅 {{ nextGame.gameDate }}</span>
                <span class="meta-pill">⏰ {{ nextGame.startTime }} - {{ nextGame.endTime }}</span>
                <span class="meta-pill">👤 Organizer: {{ nextGame.organizerName }}</span>
              </div>
            </div>
            <div class="session-cost-box">
              <span class="cost-label">Your Estimated Share</span>
              <span class="cost-amount">₹{{ nextGame.perPlayerEstimatedShare }}</span>
              <a routerLink="/payments" class="btn btn-primary btn-sm">Pay via UPI QR</a>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Recent Games List on Dashboard -->
      <div class="card recent-games-card">
        <div class="card-header">
          <h3 class="card-title">🏸 {{ i18n.t('nav.games') }}</h3>
          <a routerLink="/games" class="btn btn-outline btn-sm">{{ i18n.t('action.viewDetails') }} →</a>
        </div>
        <div class="games-table-wrapper">
          <table class="custom-table">
            <thead>
              <tr>
                <th>{{ i18n.t('game.title') }}</th>
                <th>{{ i18n.t('game.courtName') }}</th>
                <th>{{ i18n.t('game.date') }}</th>
                <th>{{ i18n.t('game.totalCost') }}</th>
                <th>{{ i18n.t('game.participants') }}</th>
                <th>{{ i18n.t('game.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let game of recentGames">
                <td class="font-bold">{{ game.title }}</td>
                <td class="text-secondary">{{ game.courtName }}</td>
                <td>{{ game.gameDate }} ({{ game.startTime }})</td>
                <td class="text-lime font-bold">₹{{ game.totalCost }}</td>
                <td>
                  <div class="avatar-group">
                    <span class="mini-avatar" *ngFor="let p of game.participants.slice(0, 4)" [title]="p.playerName">
                      {{ p.playerName.substring(0, 1) }}
                    </span>
                    <span class="mini-avatar more-avatar" *ngIf="game.participants.length > 4">+{{ game.participants.length - 4 }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge" [class.badge-completed]="game.status === 'COMPLETED'" [class.badge-scheduled]="game.status === 'SCHEDULED'">
                    {{ game.status }}
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
    .dashboard-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .welcome-banner {
      background: linear-gradient(135deg, rgba(22, 32, 50, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%);
      border: 1px solid rgba(163, 230, 53, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding: 2rem;
    }
    .badge-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #A3E635;
      letter-spacing: 0.08em;
      margin-bottom: 0.5rem;
    }
    .banner-title {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .banner-desc {
      color: #94A3B8;
      max-width: 650px;
      font-size: 0.95rem;
    }
    .banner-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      padding: 1.4rem;
    }
    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .lime-glow { background: rgba(163, 230, 53, 0.15); box-shadow: 0 0 15px rgba(163, 230, 53, 0.2); }
    .cyan-glow { background: rgba(56, 189, 248, 0.15); box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
    .purple-glow { background: rgba(168, 85, 247, 0.15); box-shadow: 0 0 15px rgba(168, 85, 247, 0.2); }
    .emerald-glow { background: rgba(16, 185, 129, 0.15); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
    .rose-glow { background: rgba(244, 63, 94, 0.15); box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.8rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; }
    .stat-val { font-size: 1.85rem; font-weight: 800; line-height: 1.1; margin: 0.25rem 0; color: #FFFFFF; }
    .stat-hint { font-size: 0.75rem; color: #64748B; }

    /* Dashboard Split */
    .dashboard-split {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1.5rem;
    }
    @media (max-width: 992px) {
      .dashboard-split { grid-template-columns: 1fr; }
    }
    .bar-chart-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-top: 1rem;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      height: 100%;
      justify-content: flex-end;
      width: 45px;
    }
    .bar-stack {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: flex-end;
      gap: 4px;
    }
    .bar-fill {
      width: 18px;
      border-radius: 4px 4px 0 0;
      transition: height 0.5s ease;
    }
    .expense-bar { background: linear-gradient(to top, #65a30d, #A3E635); }
    .paid-bar { background: linear-gradient(to top, #059669, #10B981); }
    .bar-label { font-size: 0.725rem; color: #94A3B8; }
    .bar-val { font-size: 0.75rem; font-weight: 700; color: #FFFFFF; }
    .chart-legend {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      font-size: 0.85rem;
      color: #94A3B8;
    }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
    .dot-expense { background: #A3E635; }
    .dot-paid { background: #10B981; }

    /* Settlement list */
    .settlement-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .settle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem;
      background: rgba(14, 21, 36, 0.7);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .settle-avatars { display: flex; align-items: center; gap: 0.4rem; }
    .avatar-tag {
      width: 32px;
      height: 32px;
      background: #1e293b;
      color: #38BDF8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .organizer-tag { background: rgba(163, 230, 53, 0.2); color: #A3E635; }
    .arrow-indicator { color: #64748B; font-size: 0.85rem; }
    .settle-details { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
    .debtor-name { font-weight: 700; color: #FFFFFF; }
    .debt-verb { color: #94A3B8; font-size: 0.8rem; }
    .creditor-name { font-weight: 700; color: #A3E635; }
    .amount-badge {
      font-size: 0.95rem;
      font-weight: 800;
      color: #F43F5E;
      background: rgba(244, 63, 94, 0.12);
      padding: 0.25rem 0.65rem;
      border-radius: 8px;
    }
    .settle-empty { text-align: center; padding: 2rem; color: #10B981; font-weight: 600; }

    /* Tables */
    .games-table-wrapper { overflow-x: auto; }
    .custom-table { width: 100%; border-collapse: collapse; text-align: left; }
    .custom-table th {
      padding: 0.85rem 1rem;
      font-size: 0.775rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .custom-table td {
      padding: 1rem;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .font-bold { font-weight: 700; }
    .text-secondary { color: #94A3B8; }
    .avatar-group { display: flex; align-items: center; }
    .mini-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #334155;
      color: #FFFFFF;
      font-size: 0.7rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #111827;
      margin-left: -6px;
    }
    .mini-avatar:first-child { margin-left: 0; }
    .more-avatar { background: #A3E635; color: #090D16; }

    /* Upcoming session */
    .session-info-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .session-main h4 { font-size: 1.35rem; margin-bottom: 0.4rem; color: #FFFFFF; }
    .session-venue { color: #94A3B8; margin-bottom: 0.75rem; }
    .session-meta { display: flex; gap: 0.65rem; flex-wrap: wrap; }
    .meta-pill { background: rgba(255, 255, 255, 0.06); padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; color: #CBD5E1; }
    .session-cost-box {
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid rgba(163, 230, 53, 0.3);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .cost-label { font-size: 0.8rem; color: #94A3B8; }
    .cost-amount { font-size: 1.85rem; font-weight: 800; color: #A3E635; }
  `]
})
export class DashboardComponent implements OnInit {
  adminStats: AdminDashboardStats | null = null;
  playerStats: PlayerDashboardStats | null = null;
  settlements: SettlementSummary | null = null;
  recentGames: Game[] = [];
  nextGame: Game | null = null;

  constructor(
    public auth: AuthService,
    public dataService: SmashDataService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dataService.getAdminDashboardStats().subscribe(stats => this.adminStats = stats);
    this.dataService.getSettlementSummary().subscribe(s => this.settlements = s);
    this.dataService.getGames().subscribe(games => {
      this.recentGames = games;
      this.nextGame = games.find(g => g.status === 'SCHEDULED') || games[0];
    });

    const user = this.auth.currentUser();
    if (user && user.playerId) {
      this.dataService.getPlayerDashboardStats(user.playerId).subscribe(ps => this.playerStats = ps);
    }
  }
}
