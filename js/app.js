import { requireAuth, logout } from './auth.js';
import { APP_CONFIG } from './config.js';
import { loadBranding } from './services/brandingService.js';
import { getSupabase, resetSupabase } from './supabaseClient.js';
import {
  hideLoader,
  initNavigation,
  notifyError,
  setDbStatus,
  setUserBadge,
  showLoader,
  showPage,
  showToast,
  startClock,
  closeModal,
} from './ui.js';
import { applyBrandingToDocument } from './ui/brandingUI.js';
import {
  getGroups,
  loadGroupsPage,
  loadStudentsPage,
  populateGroupSelects,
  renderGroupsGrid,
  renderStudentsTable,
  saveGroupFromModal,
  saveStudentFromModal,
  openGroupModal,
  openStudentModal,
} from './students.js';
import { debounce, getValue, setValue, toDateString } from './utils.js';
import { enterKiosk, exitKiosk, processCode, renderTodayRecords, setScanMode, startScanner, stopScanner } from './scanner.js';
import { exportReport, generateReport, loadDashboardStats, loadReportsPage, populateReportGroups, renderActivityPage } from './reports.js';
import { getWaSettings, initWaForm } from './whatsapp.js';

const pageLoaders = {
  dashboard: async () => loadDashboardStats(),
  scanner: async () => renderTodayRecords(),
  students: async () => loadStudentsPage(),
  groups: async () => loadGroupsPage(),
  reports: async () => loadReportsPage(),
  activity: async () => renderActivityPage(document.getElementById('activity-filter')?.value || ''),
  whatsapp: async () => initWaForm(),
};

async function initApp() {
  const user = await requireAuth();
  if (!user) return;

  applyBrandingToDocument(await loadBranding());
  setUserBadge(user.email?.split('@')[0], user.email);

  const sb = getSupabase();
  setDbStatus(!!sb);
  if (!sb) {
    showSetupOverlay();
    return;
  }

  showLoader('Cargando datos...');

  try {
    if (!window.__appNavigationInitialized) {
      initNavigation();
      window.__appNavigationInitialized = true;
    }
    initEventListeners();
    if (!window.__appClockInitialized) {
      startClock();
      window.__appClockInitialized = true;
    }
    setDefaultDates();
    setScanMode('ENTRADA');
    await loadPageData('dashboard');

    const wa = getWaSettings();
    if (wa) {
      document.getElementById('wa-status-badge').textContent = wa.whatsapp_access_token ? 'Configurado ✅' : 'Sin configurar';
    }
  } catch (error) {
    notifyError(error, 'No se pudo inicializar la aplicacion.');
  } finally {
    hideLoader();
  }
}

async function loadPageData(page) {
  if (!pageLoaders[page]) return;
  try {
    await pageLoaders[page]();
  } catch (error) {
    notifyError(error, `No se pudo cargar la pagina ${page}.`);
  }
}

function initEventListeners() {
  if (window.__appListenersInitialized) return;
  window.__appListenersInitialized = true;

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.dataset.close));
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesion?')) return;
    await logout();
    window.location.href = 'login.html';
  });

  document.getElementById('btn-conectar')?.addEventListener('click', async () => {
    const url = getValue('setup-url');
    const key = getValue('setup-key');
    const errorEl = document.getElementById('setup-error');

    if (!url || !key) {
      if (errorEl) errorEl.textContent = 'Completa ambos campos.';
      return;
    }

    try {
      resetSupabase(url, key);
      document.getElementById('setup-overlay').style.display = 'none';
      showToast('Supabase conectado ✅', 'success');
      setDbStatus(true);
      await initApp();
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message;
    }
  });

  document.getElementById('btn-sin-nube')?.addEventListener('click', () => {
    document.getElementById('setup-overlay').style.display = 'none';
    showToast('Modo sin conexion activado', 'warning');
    hideLoader();
  });

  document.getElementById('btn-add-student')?.addEventListener('click', () => openStudentModal());
  document.getElementById('btn-save-student')?.addEventListener('click', async () => {
    await saveStudentFromModal();
    populateGroupSelects();
    populateReportGroups(getGroups());
    renderStudentsTable(getValue('student-search'), document.getElementById('student-group-filter')?.value || '');
    renderGroupsGrid();
  });

  document.getElementById('btn-add-group')?.addEventListener('click', () => openGroupModal());
  document.getElementById('btn-save-group')?.addEventListener('click', async () => {
    await saveGroupFromModal();
    populateGroupSelects();
    populateReportGroups(getGroups());
    renderStudentsTable(document.getElementById('student-search')?.value || '', document.getElementById('student-group-filter')?.value || '');
  });

  document.getElementById('student-search')?.addEventListener('input', debounce(() => {
    renderStudentsTable(getValue('student-search'), document.getElementById('student-group-filter')?.value || '');
  }, 250));

  document.getElementById('student-group-filter')?.addEventListener('change', (event) => {
    renderStudentsTable(getValue('student-search'), event.target.value || '');
  });

  document.getElementById('btn-start-scanner')?.addEventListener('click', startScanner);
  document.getElementById('btn-stop-scanner')?.addEventListener('click', stopScanner);
  document.getElementById('btn-mode-entrada')?.addEventListener('click', () => setScanMode('ENTRADA'));
  document.getElementById('btn-mode-salida')?.addEventListener('click', () => setScanMode('SALIDA'));
  document.getElementById('btn-manual-register')?.addEventListener('click', () => processCode(getValue('manual-code')));
  document.getElementById('manual-code')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') processCode(event.target.value);
  });
  document.getElementById('btn-enter-kiosk')?.addEventListener('click', enterKiosk);
  document.getElementById('kiosk-exit-btn')?.addEventListener('click', exitKiosk);

  document.getElementById('btn-generate-report')?.addEventListener('click', generateReport);
  document.getElementById('btn-export-report')?.addEventListener('click', exportReport);

  document.getElementById('activity-filter')?.addEventListener('change', (event) => {
    renderActivityPage(event.target.value);
  });

  document.getElementById('config-db')?.addEventListener('click', showSetupOverlay);
  document.getElementById('config-whatsapp')?.addEventListener('click', () => showPage('whatsapp'));
  document.getElementById('config-kiosk')?.addEventListener('click', enterKiosk);
  document.getElementById('config-reports')?.addEventListener('click', () => showPage('reports'));

  window.addEventListener('pagechange', async ({ detail }) => {
    await loadPageData(detail.page);
  });
}

function showSetupOverlay() {
  document.getElementById('setup-overlay').style.display = 'flex';
  setValue('setup-url', localStorage.getItem('sb_url') || '');
  setValue('setup-key', localStorage.getItem('sb_key') || '');
}

function setDefaultDates() {
  const today = toDateString();
  const monthAgo = toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  if (!document.getElementById('report-from')?.value) setValue('report-from', monthAgo);
  if (!document.getElementById('report-to')?.value) setValue('report-to', today);
}

applyBrandingToDocument(APP_CONFIG);
initApp();
