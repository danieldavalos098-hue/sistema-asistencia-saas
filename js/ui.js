// ============================================================
// ui.js
// ============================================================

import { APP_CONFIG } from './config.js';
import { getCurrentPage as getCurrentPageState, setCurrentPage } from './store/appStore.js';
import { avatarStyle } from './utils.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  scanner:   'Escáner de Asistencia',
  students:  'Alumnos',
  groups:    'Grupos',
  reports:   'Reportes',
  activity:  'Registro de Actividad',
  whatsapp:  'WhatsApp',
  config:    'Configuración',
};

export function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`)?.classList.add('active');

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[pageId] || APP_CONFIG.shortName;

  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
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
  document.querySelectorAll('.nav-item[data-page], .bottom-nav-item[data-page]').forEach(item => {
    // Clonar para eliminar listeners previos
    const clone = item.cloneNode(true);
    item.parentNode.replaceChild(clone, item);
    clone.addEventListener('click', () => showPage(clone.dataset.page));
  });

  document.getElementById('hamburger-btn')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
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

export function notifyError(error, fallback = 'Ocurrió un error inesperado.') {
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
  const p = loader.querySelector('p');
  if (p) p.textContent = message;
  loader.classList.add('show');
}

export function hideLoader() {
  document.getElementById('global-loader')?.classList.remove('show');
}

export function startClock() {
  const el = document.getElementById('topbar-time');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString(APP_CONFIG.locale, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };
  tick();
  setInterval(tick, 1000);
}

export function setUserBadge(name, email) {
  const el = document.getElementById('user-badge');
  if (el) el.textContent = name || email || 'Usuario';
}

export function setDbStatus(connected) {
  const el = document.getElementById('db-status-badge');
  if (!el) return;
  el.textContent = connected ? 'Conectado ✅' : 'Sin conexión';
  el.style.background = connected ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)';
  el.style.color       = connected ? '#22c55e' : '#64748b';
}

export function setWaStatus(configured) {
  const el = document.getElementById('wa-status-badge');
  if (!el) return;
  el.textContent = configured ? 'Configurado ✅' : 'Sin configurar';
  el.style.background = configured ? 'rgba(37,211,102,0.15)' : 'rgba(100,116,139,0.15)';
  el.style.color       = configured ? '#25d366' : '#64748b';
}

export function getAvatarStyle(name = '') {
  return avatarStyle(name);
}
