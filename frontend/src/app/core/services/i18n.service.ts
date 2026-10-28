import { Injectable, signal, computed } from '@angular/core';
import { EN_TRANSLATIONS, TE_TRANSLATIONS, TranslationDictionary } from '../i18n/translations';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type LanguageCode = 'en' | 'te';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly STORAGE_KEY = 'smash_club_lang';
  
  // Reactive Signal for current language
  currentLang = signal<LanguageCode>(this.getInitialLanguage());

  private translations: Record<LanguageCode, TranslationDictionary> = {
    en: EN_TRANSLATIONS,
    te: TE_TRANSLATIONS
  };

  constructor(private http: HttpClient) {}

  private getInitialLanguage(): LanguageCode {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'en' || saved === 'te') {
      return saved;
    }
    return 'en';
  }

  setLanguage(lang: LanguageCode) {
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);

    // Sync with backend if user is logged in
    const token = localStorage.getItem('smash_token');
    if (token) {
      this.http.put(`${environment.apiUrl}/auth/language`, { language: lang }).subscribe({
        error: () => { /* Silent fail in offline/mock mode */ }
      });
    }
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'en' ? 'te' : 'en');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    let text = this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
    if (params) {
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), String(params[p]));
      });
    }
    return text;
  }
}
