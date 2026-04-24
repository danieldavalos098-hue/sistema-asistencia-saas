// ============================================================
// whatsapp.js
// ============================================================

import {
  getDefaultTemplate,
  getWaSettings,
  loadWaSettings,
  saveWaSettings,
  sendAbsentMessage,
  sendAbsentNotifications,
  sendEntryMessage,
  sendExitMessage,
  sendWhatsAppMessage,
  testWaConnection,
} from './services/whatsappService.js';
import { notifyError, setWaStatus, showToast } from './ui.js';
import { getValue, setValue } from './utils.js';
import { sendTodayAbsentNotifications } from './reports.js';
import { updateRuntimeBranding } from './services/brandingService.js';
import { applyBrandingToDocument } from './ui/brandingUI.js';

export {
  loadWaSettings,
  saveWaSettings,
  getWaSettings,
  sendWhatsAppMessage,
  sendEntryMessage,
  sendExitMessage,
  sendAbsentMessage,
  sendAbsentNotifications,
};

let initialized = false;

export async function initWaForm() {
  try {
    const settings = await loadWaSettings();

    setValue('wsp-token',    settings?.whatsapp_access_token      || '');
    setValue('wsp-phone-id', settings?.whatsapp_phone_number_id   || '');
    setValue('wsp-biz-id',   settings?.whatsapp_business_account_id || '');
    setValue('msg-entry-text',  settings?.msg_template_entry  || getDefaultTemplate('entry'));
    setValue('msg-exit-text',   settings?.msg_template_exit   || getDefaultTemplate('exit'));
    setValue('msg-absent-text', settings?.msg_template_absent || getDefaultTemplate('absent'));
    setValue('config-kiosk-pin',        settings?.kiosk_pin         || '');
    setValue('config-institution-name', settings?.institution_name  || '');
    setWaStatus(!!settings?.whatsapp_access_token);

    if (initialized) return;
    initialized = true;

    const saveHandler = async () => {
      try {
        const saved = await saveWaSettings({
          accessToken:   getValue('wsp-token'),
          phoneNumberId: getValue('wsp-phone-id'),
          bizAccountId:  getValue('wsp-biz-id'),
          templates: {
            entry:  getValue('msg-entry-text'),
            exit:   getValue('msg-exit-text'),
            absent: getValue('msg-absent-text'),
          },
          kioskPin:        getValue('config-kiosk-pin'),
          institutionName: getValue('config-institution-name'),
        });
        applyBrandingToDocument(updateRuntimeBranding(saved?.institution_name || ''));
        setWaStatus(!!saved?.whatsapp_access_token);
        showToast('Configuración guardada ✅', 'success');
      } catch (error) {
        notifyError(error, 'No se pudo guardar la configuración de WhatsApp.');
      }
    };

    document.getElementById('btn-save-wsp')?.addEventListener('click', saveHandler);
    document.getElementById('btn-save-templates')?.addEventListener('click', saveHandler);

    document.getElementById('btn-test-wsp')?.addEventListener('click', async () => {
      try {
        const data = await testWaConnection();
        showToast(`Conectado: ${data.display_phone_number}`, 'success');
      } catch (error) {
        notifyError(error, 'Error al probar la conexión.');
      }
    });

    document.getElementById('btn-send-absent')?.addEventListener('click', async () => {
      if (!confirm('¿Enviar notificaciones a todos los ausentes de hoy?')) return;
      await sendTodayAbsentNotifications();
    });

    // Tabs de plantillas
    document.querySelectorAll('.msg-tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        document.querySelectorAll('.msg-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.msg-tab').forEach(panel => {
          panel.style.display = panel.id === `msg-${tab}` ? 'block' : 'none';
        });
        button.classList.add('active');
      });
    });

  } catch (error) {
    notifyError(error, 'No se pudo inicializar WhatsApp.');
  }
}
