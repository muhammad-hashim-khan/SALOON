export interface MockSettings {
  salonName: string;
  businessName: string;
  phone: string;
  address: string;
}

const STORAGE_KEY = 'cutandstyle_mock_settings';

const DEFAULT_SETTINGS: MockSettings = {
  salonName: 'CUT&STYLE',
  businessName: 'SALON & SPA',
  phone: '+91 98765 43210',
  address: '123 Fashion Street, New Delhi, 110001'
};

export const settingsService = {
  getSettings(): MockSettings {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return JSON.parse(data) as MockSettings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: MockSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  },

  resetSettings(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
