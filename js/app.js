import { loadDashboardStats } from './reports.js';

// 🔥 navegación simple sin romper app
function initNavigation() {
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
      });

      const target = document.getElementById(view);
      if (target) target.style.display = 'block';

      // cargar dashboard
      if (view === 'dashboard') {
        loadDashboardStats();
      }
    });
  });
}

// 🔥 inicio seguro
window.addEventListener('DOMContentLoaded', () => {
  try {
    initNavigation();
    loadDashboardStats();
  } catch (err) {
    console.error('Error inicializando app:', err);
  }
});
