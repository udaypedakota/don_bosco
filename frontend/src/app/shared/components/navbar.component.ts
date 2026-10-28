import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="top-nav">
      <div class="nav-container">
        <!-- Brand -->
        <a routerLink="/" class="brand-link">
          <div class="logo-box">
            <svg class="logo-shuttle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <circle cx="12" cy="19" r="3" fill="#A3E635" stroke="#A3E635" />
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">SMASH<span class="lime-text">CLUB</span></span>
            <span class="brand-sub">{{ i18n.t('brand.tagline') }}</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>{{ i18n.t('nav.dashboard') }}</span>
          </a>
          <a routerLink="/games" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏸</span>
            <span>{{ i18n.t('nav.games') }}</span>
          </a>
          <a routerLink="/players" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>{{ i18n.t('nav.players') }}</span>
          </a>
          <a routerLink="/expenses" routerLinkActive="active" class="nav-item" *ngIf="auth.isAdmin()">
            <span class="nav-icon">⚖️</span>
            <span>{{ i18n.t('nav.expenses') }}</span>
          </a>
          <a routerLink="/payments" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span>
            <span>{{ i18n.t('nav.payments') }}</span>
          </a>
          <a routerLink="/settlements" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🤝</span>
            <span>{{ i18n.t('nav.settlements') }}</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📈</span>
            <span>{{ i18n.t('nav.reports') }}</span>
          </a>
        </nav>

        <!-- Right Side: Role Switcher, Language Toggle, User Pill -->
        <div class="nav-actions">
          <!-- Role Switcher for instant Demo testing -->
          <button (click)="toggleRole()" class="role-switch-btn" title="Toggle between Admin and Player view">
            <span class="role-pill" [class.admin-pill]="auth.isAdmin()" [class.player-pill]="!auth.isAdmin()">
              {{ auth.isAdmin() ? '🛡️ Admin' : '🏸 Player' }}
            </span>
            <span class="role-switch-text">{{ auth.isAdmin() ? 'Switch to Player' : 'Switch to Admin' }}</span>
          </button>

          <!-- Language Switcher -->
          <button (click)="i18n.toggleLanguage()" class="lang-btn" [title]="'Switch to ' + (i18n.currentLang() === 'en' ? 'Telugu' : 'English')">
            <span class="lang-flag">{{ i18n.currentLang() === 'en' ? '🇮🇳' : '🇬🇧' }}</span>
            <span class="lang-name">{{ i18n.currentLang() === 'en' ? 'తెలుగు' : 'English' }}</span>
          </button>

          <!-- User Pill -->
          <div class="user-pill">
            <img [src]="auth.currentUser()?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'" alt="Avatar" class="user-avatar" />
            <div class="user-info">
              <span class="user-name">{{ auth.currentUser()?.playerName || 'User' }}</span>
              <span class="user-role">{{ auth.isAdmin() ? i18n.t('nav.role.admin') : i18n.t('nav.role.player') }}</span>
            </div>
          </div>

          <!-- Mobile Hamburger -->
          <button (click)="mobileMenuOpen = !mobileMenuOpen" class="mobile-toggle-btn" aria-label="Toggle Navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div class="mobile-menu" *ngIf="mobileMenuOpen">
        <a routerLink="/dashboard" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.dashboard') }}</a>
        <a routerLink="/games" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.games') }}</a>
        <a routerLink="/players" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.players') }}</a>
        <a routerLink="/expenses" (click)="mobileMenuOpen = false" class="mobile-nav-item" *ngIf="auth.isAdmin()">{{ i18n.t('nav.expenses') }}</a>
        <a routerLink="/payments" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.payments') }}</a>
        <a routerLink="/settlements" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.settlements') }}</a>
        <a routerLink="/reports" (click)="mobileMenuOpen = false" class="mobile-nav-item">{{ i18n.t('nav.reports') }}</a>
      </div>
    </header>
  `,
  styles: [`
    .top-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(11, 15, 25, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .nav-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      text-decoration: none;
    }
    .logo-box {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(132, 204, 22, 0.05) 100%);
      border: 1px solid rgba(163, 230, 53, 0.4);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(163, 230, 53, 0.2);
    }
    .logo-shuttle {
      width: 24px;
      height: 24px;
      color: #A3E635;
    }
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      display: block;
      line-height: 1.1;
    }
    .lime-text {
      color: #A3E635;
    }
    .brand-sub {
      font-size: 0.725rem;
      color: #94A3B8;
      display: block;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.95rem;
      color: #94A3B8;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    .nav-item:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.05);
    }
    .nav-item.active {
      color: #090D16;
      background: #A3E635;
      box-shadow: 0 4px 12px rgba(163, 230, 53, 0.3);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .role-switch-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(22, 32, 50, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      cursor: pointer;
      color: #E2E8F0;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .role-switch-btn:hover {
      border-color: #A3E635;
      background: rgba(30, 44, 69, 0.9);
    }
    .role-pill {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-weight: 700;
    }
    .admin-pill {
      background: rgba(163, 230, 53, 0.2);
      color: #A3E635;
    }
    .player-pill {
      background: rgba(56, 189, 248, 0.2);
      color: #38BDF8;
    }
    .lang-btn {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(22, 32, 50, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #E2E8F0;
      padding: 0.45rem 0.85rem;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .lang-btn:hover {
      border-color: #A3E635;
      color: #A3E635;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding-left: 0.5rem;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #A3E635;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .user-role {
      font-size: 0.725rem;
      color: #94A3B8;
    }
    .mobile-toggle-btn {
      display: none;
      background: transparent;
      border: none;
      color: #FFFFFF;
      cursor: pointer;
      padding: 0.4rem;
    }
    .mobile-menu {
      display: flex;
      flex-direction: column;
      background: #111827;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem;
      gap: 0.5rem;
    }
    .mobile-nav-item {
      color: #CBD5E1;
      text-decoration: none;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      font-weight: 600;
    }
    .mobile-nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #A3E635;
    }
    @media (max-width: 1080px) {
      .nav-links { display: none; }
      .mobile-toggle-btn { display: block; }
      .role-switch-text { display: none; }
    }
  `]
})
export class NavbarComponent {
  mobileMenuOpen = false;

  constructor(public auth: AuthService, public i18n: I18nService) {}

  toggleRole() {
    if (this.auth.isAdmin()) {
      this.auth.loginAsDemoPlayer();
    } else {
      this.auth.loginAsDemoAdmin();
    }
  }
}
