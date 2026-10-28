import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GamesComponent } from './features/games/games.component';
import { PlayersComponent } from './features/players/players.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { PaymentsComponent } from './features/payments/payments.component';
import { SettlementsComponent } from './features/settlements/settlements.component';
import { ReportsComponent } from './features/reports/reports.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'games', component: GamesComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'payments', component: PaymentsComponent },
  { path: 'settlements', component: SettlementsComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: 'dashboard' }
];
