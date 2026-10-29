import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { Player, Game, Payment, AtlasStatus } from '../models/club.models';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private http = inject(HttpClient);
  private apiUrl = (typeof window !== 'undefined' && window.location.port === '4200')
    ? 'http://localhost:5000/api'
    : '/api';

  // Active Authenticated User
  currentUser = signal<{ id: string; name: string; phone: string; role: 'admin' | 'player'; avatar?: string } | null>(
    (() => {
      try {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('smash_user') : null;
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    })()
  );

  // Dynamic state signals (Loaded directly from database)
  players = signal<Player[]>([]);
  games = signal<Game[]>([]);
  payments = signal<Payment[]>([]);
  pendingPayments = computed(() => this.payments().filter(p => p.status === 'pending'));
  atlasStatus = signal<AtlasStatus>({
    connected: false,
    database: 'Checking...',
    maskedUri: '',
    stats: { players: 0, games: 0, payments: 0 },
    mode: 'Checking'
  });
  loading = signal<boolean>(false);

  constructor() {
    this.refreshAllData();
  }

  refreshAllData(): void {
    this.checkAtlasStatus();
    this.loadPlayers();
    this.loadGames();
    this.loadPayments();
  }

  checkAtlasStatus(): void {
    this.http.get<AtlasStatus>(`${this.apiUrl}/status`).pipe(
      catchError(() => of({
        connected: false,
        database: 'Backend Server Offline',
        maskedUri: '',
        stats: { players: 0, games: 0, payments: 0 },
        mode: 'Offline'
      }))
    ).subscribe(status => {
      this.atlasStatus.set(status);
    });
  }

  setAtlasPassword(password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/set-password`, { password }).pipe(
      tap(res => {
        if (res.success) {
          this.refreshAllData();
        }
      })
    );
  }

  // Authentication
  login(identifier: string, password?: string, role?: string): Observable<{ success: boolean; user: any }> {
    return this.http.post<{ success: boolean; user: any }>(`${this.apiUrl}/auth/login`, { identifier, password, role }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('smash_user', JSON.stringify(res.user));
          this.refreshAllData();
        }
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('smash_user');
  }

  // Players
  loadPlayers(): void {
    this.http.get<Player[]>(`${this.apiUrl}/players`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.players.set(data || []);
      // Automatically refresh currentUser from fresh database data!
      const cur = this.currentUser();
      if (cur) {
        const fresh = (data || []).find(p => p.id === cur.id);
        if (fresh) {
          const updatedUser = {
            ...cur,
            name: fresh.name,
            phone: fresh.phone,
            role: fresh.role,
            avatar: fresh.avatar
          };
          this.currentUser.set(updatedUser);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('smash_user', JSON.stringify(updatedUser));
          }
        }
      }
    });
  }

  updatePlayer(id: string, updates: Partial<Player>): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/players/${id}`, updates).pipe(
      tap(updatedPlayer => {
        this.players.update(list => list.map(p => p.id === id ? { ...p, ...updatedPlayer } : p));
        const cur = this.currentUser();
        if (cur && cur.id === id) {
          const updatedUser = {
            ...cur,
            name: updatedPlayer.name,
            phone: updatedPlayer.phone,
            role: updatedPlayer.role,
            avatar: updatedPlayer.avatar
          };
          this.currentUser.set(updatedUser);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('smash_user', JSON.stringify(updatedUser));
          }
        }
      })
    );
  }

  addPlayer(player: { name: string; phone: string; role: string; password?: string }): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/players`, player).pipe(
      tap(newPlayer => {
        this.players.update(list => [...list, newPlayer]);
      })
    );
  }

  deletePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/players/${id}`).pipe(
      tap(() => {
        this.players.update(list => list.filter(p => p.id !== id));
      })
    );
  }

  // Games (For Today, Tomorrow, or Any Custom Date)
  loadGames(): void {
    this.http.get<Game[]>(`${this.apiUrl}/games`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.games.set(data || []);
    });
  }

  addGame(game: Partial<Game>): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games`, game).pipe(
      tap(newGame => {
        this.games.update(list => [newGame, ...list]);
        this.loadPlayers();
      })
    );
  }

  // Payments
  loadPayments(): void {
    this.http.get<Payment[]>(`${this.apiUrl}/payments`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.payments.set(data || []);
    });
  }

  recordPayment(payment: { playerId: string; amount: number; mode: string; gameId?: string; notes?: string }): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, payment).pipe(
      tap(newPay => {
        this.payments.update(list => [newPay, ...list]);
        this.loadPlayers();
      })
    );
  }

  claimPayment(claim: { playerId: string; amount: number; gameId?: string; utr?: string; mode?: string; notes?: string }): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/claim`, claim).pipe(
      tap(newClaim => {
        this.payments.update(list => [newClaim, ...list]);
        this.loadPayments();
      })
    );
  }

  approvePayment(paymentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/${paymentId}/approve`, {}).pipe(
      tap(() => {
        this.loadPayments();
        this.loadPlayers();
      })
    );
  }

  rejectPayment(paymentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/${paymentId}/reject`, {}).pipe(
      tap(() => {
        this.loadPayments();
      })
    );
  }
}
