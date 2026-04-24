import { requireAuth, logout } from './auth.js';
import { APP_CONFIG } from './config.js';
import { loadBranding } from './services/brandingService.js';
import { getSupabase } from './supabaseClient.js';
import {
  hideLoader,
  notifyError,
  setDbStatus,
  setUserBadge,
  showLoader,
  startClock
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
import {
  enterKiosk,
  exitKiosk,
  processCode,
  renderTodayRecords,
  setScanMode,
  startScanner,
  stopScanner
} from './scanner.js';
import {
  exportReport,
  generateReport,
  loadDashboardStats,
  loadReportsPage,
  populateReportGroups,
  renderActivityPage
} from './reports.js';
import { initWaForm } from './whatsapp.js';


// 🔥 LIMPIAR VISTA (SOLUCIÓN CLAVE)
function clearView() {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
}


// 🔥 CARGADORES DE PÁGINA
const pageLoaders = {
  dashboard: async () => loadDashboardStats(),
  scanner: async () => renderTodayRecords(),
  students: async () => loadStudentsPage(),
  groups: async () => loadGroupsPage(),
  reports: async () => loadReportsPage(),
  activity: async () => renderActivityPage(document.getElementById('activity-filter')?.value || ''),
  whatsapp: async () => initWaForm(),
  config: async () => {} // placeholder limpio
};


// 🔥 INICIO APP
async function initApp() {
  const user = await requireAuth();
  if (!user) return;

  applyBrandingToDocument(await loadBranding());
  setUserBadge(user.email?.split('@')[0], user.email);

  const sb = getSupabase();
  setDbStatus(!!sb);

  showLoader('Cargando datos...');

  try {
    initEventListeners();
    startClock();
    setDefaultDates();
    setScanMode('ENTRADA');

    await loadPage('dashboard');

  } catch (error) {
    notifyError(error, 'No se pudo inicializar la aplicación.');
  } finally {
    hideLoader();
  }
}


// 🔥 CAMBIO DE PÁGINA (NAVEGACIÓN LIMPIA)
async function loadPage(page) {
  clearView();

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  const title = document.getElementById('page-title');
  if (title) title.textContent = target?.dataset?.title || page;

  if (pageLoaders[page]) {
    try {
      await pageLoaders[page]();
    } catch (error) {
      notifyError(error, `Error cargando ${page}`);
    }
  }
}


// 🔥 EVENTOS
function initEventListeners() {
  if (window.__listenersReady) return;
  window.__listenersReady = true;

  // SIDEBAR
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (!page) return;

      document.querySelectorAll('.nav-item, .bottom-nav-item')
        .forEach(i => i.classList.remove('active'));

      item.classList.add('active');

      loadPage(page);
    });
  });

  // LOGOUT
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await logout();
    window.location.href = 'login.html';
  });

  // SCANNER
  document.getElementById('btn-start-scanner')?.addEventListener('click', startScanner);
  document.getElementById('btn-stop-scanner')?.addEventListener('click', stopScanner);
  document.getElementById('btn-mode-entrada')?.addEventListener('click', () => setScanMode('ENTRADA'));
  document.getElementById('btn-mode-salida')?.addEventListener('click', () => setScanMode('SALIDA'));
  document.getElementById('btn-manual-register')?.addEventListener('click', () => processCode(getValue('manual-code')));

  document.getElementById('manual-code')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') processCode(e.target.value);
  });

  document.getElementById('btn-enter-kiosk')?.addEventListener('click', enterKiosk);
  document.getElementById('kiosk-exit-btn')?.addEventListener('click', exitKiosk);

  // STUDENTS
  document.getElementById('btn-add-student')?.addEventListener('click', openStudentModal);
  document.getElementById('btn-save-student')?.addEventListener('click', async () => {
    await saveStudentFromModal();
    populateGroupSelects();
    populateReportGroups(getGroups());
    renderStudentsTable(getValue('student-search'), document.getElementById('student-group-filter')?.value || '');
    renderGroupsGrid();
  });

  document.getElementById('student-search')?.addEventListener('input', debounce(() => {
    renderStudentsTable(getValue('student-search'), document.getElementById('student-group-filter')?.value || '');
  }, 250));

  document.getElementById('student-group-filter')?.addEventListener('change', (e) => {
    renderStudentsTable(getValue('student-search'), e.target.value || '');
  });

  // GROUPS
  document.getElementById('btn-add-group')?.addEventListener('click', openGroupModal);
  document.getElementById('btn-save-group')?.addEventListener('click', async () => {
    await saveGroupFromModal();
    populateGroupSelects();
    populateReportGroups(getGroups());
  });

  // REPORTES
  document.getElementById('btn-generate-report')?.addEventListener('click', generateReport);
  document.getElementById('btn-export-report')?.addEventListener('click', exportReport);

  document.getElementById('activity-filter')?.addEventListener('change', (e) => {
    renderActivityPage(e.target.value);
  });
}


// 🔥 FECHAS
function setDefaultDates() {
  const today = toDateString();
  const monthAgo = toDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  if (!document.getElementById('report-from')?.value) setValue('report-from', monthAgo);
  if (!document.getElementById('report-to')?.value) setValue('report-to', today);
}


// 🔥 INIT
document.addEventListener('DOMContentLoaded', () => {
  applyBrandingToDocument(APP_CONFIG);
  initApp();
});
