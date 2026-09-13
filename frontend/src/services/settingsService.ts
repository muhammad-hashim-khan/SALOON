import { supabase } from '../lib/supabase';

export interface MockSettings {
  salonName: string;
  businessName: string;
  phone: string;
  address: string;
}

const DEFAULT_SETTINGS: MockSettings = {
  salonName: 'CUT&STYLE',
  businessName: 'SALON & SPA',
  phone: '+91 98765 43210',
  address: '123 Fashion Street, New Delhi, 110001'
};

export const settingsService = {
  /**
   * Fetch salon settings from the database.
   * Uses maybeSingle() so it returns null (not a 406) when no row exists.
   * Falls back to DEFAULT_SETTINGS if the row is missing or there is an error.
   * NOTE: Only call this AFTER the Supabase auth session has been restored.
   */
  async getSettings(): Promise<MockSettings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();  // ← was .single() which causes 406 when 0 rows

    if (error) {
      // Log for debugging but don't throw — fall back to defaults
      console.warn('[settingsService] getSettings error:', error.message, error.code);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      // No row yet — return defaults (seed will insert one on next db push)
      return DEFAULT_SETTINGS;
    }

    return {
      salonName: data.salon_name ?? DEFAULT_SETTINGS.salonName,
      businessName: data.business_name ?? DEFAULT_SETTINGS.businessName,
      phone: data.phone ?? DEFAULT_SETTINGS.phone,
      address: data.address ?? DEFAULT_SETTINGS.address
    };
  },

  async saveSettings(settings: MockSettings): Promise<void> {
    const { data } = await supabase
      .from('settings')
      .select('id')
      .maybeSingle();  // ← was .single()

    if (!data) {
      // No row — insert
      await supabase.from('settings').insert({
        salon_name: settings.salonName,
        business_name: settings.businessName,
        phone: settings.phone,
        address: settings.address
      });
    } else {
      // Row exists — update
      await supabase.from('settings').update({
        salon_name: settings.salonName,
        business_name: settings.businessName,
        phone: settings.phone,
        address: settings.address
      }).eq('id', data.id);
    }
  },

  async resetSettings(): Promise<void> {
    const { data } = await supabase
      .from('settings')
      .select('id')
      .maybeSingle();  // ← was .single()

    if (data) {
      await supabase.from('settings').update({
        salon_name: DEFAULT_SETTINGS.salonName,
        business_name: DEFAULT_SETTINGS.businessName,
        phone: DEFAULT_SETTINGS.phone,
        address: DEFAULT_SETTINGS.address
      }).eq('id', data.id);
    }
  }
};
