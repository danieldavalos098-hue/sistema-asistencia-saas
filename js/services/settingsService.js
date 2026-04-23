import { APP_CONFIG } from '../config.js';
import { getCurrentUser } from '../auth.js';
import { getSupabase } from '../supabaseClient.js';
import { getSettingsState, setSettingsState } from '../store/settingsStore.js';

function buildSettingsError(message, error) {
  return new Error(error?.message || message);
}

export async function loadSettings() {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();

    if (!sb || !user) {
      setSettingsState(null);
      return null;
    }

    const { data, error } = await sb
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw buildSettingsError('No se pudo cargar la configuración.', error);
    setSettingsState(data || null);
    return data || null;
  } catch (error) {
    throw buildSettingsError('No se pudo cargar la configuración.', error);
  }
}

export function getSettings() {
  return getSettingsState();
}

export async function saveSettings(patch) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();

    if (!sb || !user) {
      throw new Error('Sin sesión o sin conexión.');
    }

    const current = getSettingsState() || {};
    const payload = {
      ...current,
      ...patch,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw buildSettingsError('No se pudo guardar la configuración.', error);
    setSettingsState(data);
    return data;
  } catch (error) {
    throw buildSettingsError('No se pudo guardar la configuración.', error);
  }
}

export function getInstitutionNameFromSettings() {
  return getSettingsState()?.institution_name?.trim() || '';
}

export function getUserKioskPin() {
  return getSettingsState()?.kiosk_pin?.trim() || APP_CONFIG.kioskPin;
}
