import { APP_CONFIG } from '../config.js';
import { getSupabase } from '../supabaseClient.js';
import { getCurrentUser } from '../auth.js';
import { getBranding, setBranding } from '../store/appStore.js';
import { getInstitutionNameFromSettings, loadSettings } from './settingsService.js';

function buildBranding(institutionName = '') {
  const entityName = institutionName || APP_CONFIG.entityName;
  return {
    ...APP_CONFIG,
    entityName,
    appName: APP_CONFIG.appName,
    shortName: APP_CONFIG.shortName,
    footerText: APP_CONFIG.footerText,
  };
}

export function updateRuntimeBranding(institutionName = '') {
  const branding = buildBranding(institutionName || getInstitutionNameFromSettings());
  setBranding(branding);
  return branding;
}

export async function loadBranding() {
  try {
    const cached = getBranding();
    if (cached) return cached;

    const fallback = buildBranding();
    const sb = getSupabase();
    const user = await getCurrentUser();

    if (!sb || !user) {
      return updateRuntimeBranding(fallback.entityName);
    }

    await loadSettings().catch(() => null);

    const { data, error } = await sb
      .from('branding')
      .select('institution_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return updateRuntimeBranding(getInstitutionNameFromSettings());
    }

    return updateRuntimeBranding(data?.institution_name || getInstitutionNameFromSettings());
  } catch {
    return updateRuntimeBranding(getInstitutionNameFromSettings());
  }
}

export function getResolvedBranding() {
  return getBranding() || buildBranding();
}

export function injectEntityName(template = '') {
  return template.replace(/\{\{entityName\}\}/g, getResolvedBranding().entityName);
}
