import { APP_CONFIG } from './config.js';
import { getCurrentPage as getCurrentPageState, setCurrentPage } from './store/appStore.js';
import { avatarStyle } from './utils.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  scanner: 'Escaner de Asistencia',
  students: 'Alumnos',
  groups: 'Grupos',
  reports: 'Reportes',
  activity: 'Registro de Actividad',
  whatsapp: 'WhatsApp',
  config: 'Configuracion',
};

export function showPage(pageId) {
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
  document.getElementById(`page-${pageId}`)?.classList.add('active');

  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = PAGE_TITLES[pageId] || APP_CONFIG.shortName;

  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  setCurrentPage(pageId);
  closeSidebar();
  window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: pageId } }));
}

export function getCurrentPage() {
  return getCurrentPageState();
}

export function initNavigation() {
  document.querySelectorAll('.nav-item[data-page], .bottom-nav-item[data-page]').forEach((item) => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  document.getElementById('hamburger-btn')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.classList.remove('show');
    });
  });
}

export function openSidebar() {
  document.querySelector('.sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('show');
}

export function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

export function toggleSidebar() {
  if (document.querySelector('.sidebar')?.classList.contains('open')) closeSidebar();
  else openSidebar();
}

export function showToast(message, type = '', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`.trim();

  const icon = document.createElement('span');
  icon.textContent = { success: '✅', error: '❌', warning: '⚠️' }[type] || 'ℹ️';

  const text = document.createElement('span');
  text.textContent = message;

  toast.append(icon, text);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function notifyError(error, fallback = 'Ocurrio un error inesperado.') {
  const message = error?.message || fallback;
  showToast(message, 'error');
}

export function openModal(id) {
  document.getElementById(id)?.classList.add('show');
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}

export function showLoader(message = 'Cargando datos...') {
  const loader = document.getElementById('global-loader');
  if (!loader) return;
  const paragraph = loader.querySelector('p');
  if (paragraph) paragraph.textContent = message;
  loader.classList.add('show');
}

export function hideLoader() {
  document.getElementById('global-loader')?.classList.remove('show');
}

export function startClock() {
  const element = document.getElementById('topbar-time');
  if (!element) return;

  const tick = () => {
    element.textContent = new Date().toLocaleTimeString(APP_CONFIG.locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  tick();
  setInterval(tick, 1000);
}

export function setUserBadge(name, email) {
  const element = document.getElementById('user-badge');
  if (element) element.textContent = name || email || 'Usuario';
}

export function setDbStatus(connected) {
  const element = document.getElementById('db-status-badge');
  if (!element) return;

  element.textContent = connected ? 'Conectado ✅' : 'Sin conexion';
  element.style.background = connected ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)';
  element.style.color = connected ? '#22c55e' : '#64748b';
}

export function setWaStatus(configured) {
  const element = document.getElementById('wa-status-badge');
  if (!element) return;

  element.textContent = configured ? 'Configurado ✅' : 'Sin configurar';
  element.style.background = configured ? 'rgba(37,211,102,0.15)' : 'rgba(100,116,139,0.15)';
  element.style.color = configured ? '#25d366' : '#64748b';
}

export function getAvatarStyle(name = '') {
  return avatarStyle(name);
}
