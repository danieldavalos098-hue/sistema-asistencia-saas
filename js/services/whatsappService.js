import { DEFAULT_MESSAGE_TEMPLATES } from '../config.js';
import { getResolvedBranding, loadBranding } from './brandingService.js';
import { getStudents } from './studentService.js';
import { normalizePhone, toDateString } from '../utils.js';
import { getSettings, getUserKioskPin, loadSettings, saveSettings } from './settingsService.js';

export async function loadWaSettings() {
  try {
    return await loadSettings();
  } catch (error) {
    throw new Error(error?.message || 'No se pudo cargar la configuración de WhatsApp.');
  }
}

export function getWaSettings() {
  return getSettings();
}

export async function saveWaSettings({ accessToken, phoneNumberId, bizAccountId, templates, kioskPin, institutionName }) {
  try {
    return await saveSettings({
      whatsapp_access_token: accessToken,
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_business_account_id: bizAccountId,
      msg_template_entry: templates?.entry,
      msg_template_exit: templates?.exit,
      msg_template_absent: templates?.absent,
      kiosk_pin: kioskPin,
      institution_name: institutionName,
    });
  } catch (error) {
    throw new Error(error?.message || 'No se pudo guardar la configuración de WhatsApp.');
  }
}

export async function sendWhatsAppMessage(to, message) {
  try {
    const settings = getSettings();
    if (!settings?.whatsapp_access_token || !settings?.whatsapp_phone_number_id) {
      throw new Error('WhatsApp no está configurado.');
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${settings.whatsapp_phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.whatsapp_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(to),
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar el mensaje de WhatsApp.');
  }
}

function applyTemplate(template, vars) {
  const entityName = getResolvedBranding().entityName
    || getSettings()?.institution_name
    || '';

  return template
    .replace(/\{\{nombre\}\}/g, vars.nombre || '')
    .replace(/\{\{hora\}\}/g, vars.hora || '')
    .replace(/\{\{fecha\}\}/g, vars.fecha || '')
    .replace(/\{\{grupo\}\}/g, vars.grupo || '')
    .replace(/\{\{entityName\}\}/g, entityName);
}

export function getDefaultTemplate(type) {
  const entityName = getResolvedBranding().entityName || getSettings()?.institution_name || '';
  return (DEFAULT_MESSAGE_TEMPLATES[type] || '').replace(/\{\{entityName\}\}/g, entityName);
}

export async function sendEntryMessage(phone, nombre, hora, fecha, grupo = '') {
  try {
    await loadBranding();
    const template = getSettings()?.msg_template_entry || getDefaultTemplate('entry');
    return await sendWhatsAppMessage(phone, applyTemplate(template, { nombre, hora, fecha, grupo }));
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar la notificación de entrada.');
  }
}

export async function sendExitMessage(phone, nombre, hora, fecha, grupo = '') {
  try {
    await loadBranding();
    const template = getSettings()?.msg_template_exit || getDefaultTemplate('exit');
    return await sendWhatsAppMessage(phone, applyTemplate(template, { nombre, hora, fecha, grupo }));
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar la notificación de salida.');
  }
}

export async function sendAbsentMessage(phone, nombre, fecha, grupo = '') {
  try {
    await loadBranding();
    const template = getSettings()?.msg_template_absent || getDefaultTemplate('absent');
    return await sendWhatsAppMessage(phone, applyTemplate(template, { nombre, fecha, grupo }));
  } catch (error) {
    throw new Error(error?.message || 'No se pudo enviar la notificación de inasistencia.');
  }
}

export async function sendAbsentNotifications(presentIds) {
  try {
    const today = toDateString(new Date());
    let sent = 0;
    let errors = 0;

    for (const student of getStudents()) {
      if (!student.phone || presentIds.has(student.id)) continue;

      try {
        await sendAbsentMessage(student.phone, student.name, today);
        sent += 1;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        errors += 1;
      }
    }

    return { sent, errors };
  } catch (error) {
    throw new Error(error?.message || 'No se pudieron enviar las notificaciones de inasistencia.');
  }
}

export async function testWaConnection() {
  try {
    const settings = getSettings();
    if (!settings?.whatsapp_access_token || !settings?.whatsapp_phone_number_id) {
      throw new Error('Completa la configuración primero.');
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${settings.whatsapp_phone_number_id}?fields=id,display_phone_number`,
      { headers: { Authorization: `Bearer ${settings.whatsapp_access_token}` } }
    );

    const data = await response.json();
    if (!response.ok || !data.id) throw new Error('Credenciales inválidas.');
    return data;
  } catch (error) {
    throw new Error(error?.message || 'No se pudo validar la conexión de WhatsApp.');
  }
}

export function getConfiguredKioskPin() {
  return getUserKioskPin();
}
