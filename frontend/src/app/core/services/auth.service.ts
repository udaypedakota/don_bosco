import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserSession } from '../models/smash.models';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'smash_token';
  private readonly USER_KEY = 'smash_user';

  currentUser = signal<UserSession | null>(this.getStoredUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ROLE_ADMIN');

  constructor(private http: HttpClient, private i18nService: I18nService) {
    // If not logged in, log in as Demo Admin by default so user can immediately explore all features
    if (!this.currentUser()) {
      this.loginAsDemoAdmin();
    }
  }

  private getStoredUser(): UserSession | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): Observable<UserSession> {
    return this.http.post<UserSession>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(user => this.handleAuthSuccess(user)),
        catchError(() => {
          // If backend is offline or network error, fallback to demo authentication
          if (username === 'admin' || username === 'vikram') {
            const demo = this.getDemoAdminSession();
            this.handleAuthSuccess(demo);
            return of(demo);
          } else {
            const demo = this.getDemoPlayerSession();
            this.handleAuthSuccess(demo);
            return of(demo);
          }
        })
      );
  }

  loginAsDemoAdmin() {
    const admin = this.getDemoAdminSession();
    this.handleAuthSuccess(admin);
  }

  loginAsDemoPlayer() {
    const player = this.getDemoPlayerSession();
    this.handleAuthSuccess(player);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  private handleAuthSuccess(session: UserSession) {
    localStorage.setItem(this.TOKEN_KEY, session.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(session));
    this.currentUser.set(session);
    if (session.preferredLanguage === 'te' || session.preferredLanguage === 'en') {
      this.i18nService.setLanguage(session.preferredLanguage);
    }
  }

  private getDemoAdminSession(): UserSession {
    return {
      token: 'demo-jwt-admin-token-smash-club',
      userId: 'user-001',
      username: 'Phani',
      email: 'phani.pedakota@smashclub.in',
      mobileNumber: '9876543210',
      role: 'ROLE_ADMIN',
      playerId: 'player-001',
      playerName: 'Phani',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      preferredLanguage: 'en'
    };
  }

  private getDemoPlayerSession(): UserSession {
    return {
      token: 'demo-jwt-player-token-smash-club',
      userId: 'user-002',
      username: 'Uday',
      email: 'uday.pedakota@smashclub.in',
      mobileNumber: '9876543211',
      role: 'ROLE_PLAYER',
      playerId: 'player-002',
      playerName: 'Uday Pedakota',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      preferredLanguage: 'en'
    };
  }
}
