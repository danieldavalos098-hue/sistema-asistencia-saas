// ============================================================
// app.js — ORQUESTADOR PRINCIPAL
// ============================================================

import { initNavigation, showPage, startClock, setUserBadge, setDbStatus, showLoader, hideLoader, notifyError, openModal, closeModal } from './ui.js';
import { isConnected, resetSupabase } from './supabaseClient.js';
import { getCurrentUser, logout } from './auth.js';
import { applyBrandingToDocument } from './ui/brandingUI.js';
import { loadBranding } from './services/brandingService.js';
import { hasLoadedPage, markPageLoaded } from './store/appStore.js';

import { loadDashboardStats } from './reports.js';
import { loadStudentsPage, loadGroupsPage, saveStudentFromModal, saveGroupFromModal, openStudentModal, openGroupModal, renderStudentsTable } from './students.js';
import { loadReportsPage, generateReport, exportReport, renderActivityPage } from './reports.js';
import { initWaForm } from './whatsapp.js';
import { startScanner, stopScanner, setScanMode, processCode, renderTodayRecords, enterKiosk, exitKiosk } from './scanner.js';

window.addEventListener('DOMContentLoaded', async () => {
  const connected = isConnected();
  setDbStatus(connected);

  if (!connected) {
    const overlay = document.getElementById('setup-overlay');
    if (overlay) overlay.style.display = 'flex';

    document.getElementById('btn-conectar')?.addEventListener('click', async () => {
      const url   = document.getElementById('setup-url')?.value.trim();
      const key   = document.getElementById('setup-key')?.value.trim();
      const errEl = document.getElementById('setup-error');
      if (errEl) errEl.textContent = '';
      if (!url || !key) {
        if (errEl) errEl.textContent = 'Completa ambos campos.';
        return;
      }
      try {
        resetSupabase(url, key);
        if (overlay) overlay.style.display = 'none';
        await bootApp();
      } catch (e) {
        if (errEl) errEl.textContent = e.message;
      }
    });

    document.getElementById('btn-sin-nube')?.addEventListener('click', () => {
      if (overlay) overlay.style.display = 'none';
      bootApp();
    });

    return;
  }

  await bootApp();
});

async function bootApp() {
  try {
    showLoader();

    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    setUserBadge(user.user_metadata?.name || '', user.email || '');

    // Branding
    const branding = await loadBranding();
    applyBrandingToDocument(branding);

    // Navigation
    initNavigation();
    startClock();

    // Lazy load por página
    window.addEventListener('pagechange', async ({ detail: { page } }) => {
      if (hasLoadedPage(page)) {
        // Scanner: re-renderizar registros del día cada vez
        if (page === 'scanner') renderTodayRecords().catch(() => {});
        return;
      }
      markPageLoaded(page);

      try {
        if (page === 'dashboard')  await loadDashboardStats();
        if (page === 'students')   await loadStudentsPage();
        if (page === 'groups')     await loadGroupsPage();
        if (page === 'reports')    await loadReportsPage();
        if (page === 'activity')   await renderActivityPage();
        if (page === 'whatsapp')   await initWaForm();
        if (page === 'config')     await initWaForm();
        if (page === 'scanner')    await renderTodayRecords();
      } catch (e) {
        notifyError(e);
      }
    });

    // ── Logout ──────────────────────────────────────────────
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      try { await logout(); } catch (_) {}
      window.location.href = 'index.html';
    });

    // ── Cerrar modales via data-close ────────────────────────
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.getAttribute('data-close'));
      });
    });

    // Click fuera del modal cierra
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });

    // ── Alumnos ──────────────────────────────────────────────
    document.getElementById('btn-add-student')?.addEventListener('click', () => openStudentModal());
    document.getElementById('btn-save-student')?.addEventListener('click', () => saveStudentFromModal());

    document.getElementById('student-search')?.addEventListener('input', e => {
      const groupId = document.getElementById('student-group-filter')?.value || '';
      renderStudentsTable(e.target.value, groupId);
    });

    document.getElementById('student-group-filter')?.addEventListener('change', e => {
      const search = document.getElementById('student-search')?.value || '';
      renderStudentsTable(search, e.target.value);
    });

    // ── Grupos ───────────────────────────────────────────────
    document.getElementById('btn-add-group')?.addEventListener('click', () => openGroupModal());
    document.getElementById('btn-save-group')?.addEventListener('click', () => saveGroupFromModal());

    // ── Reportes ─────────────────────────────────────────────
    document.getElementById('btn-generate-report')?.addEventListener('click', () => generateReport());
    document.getElementById('btn-export-report')?.addEventListener('click', () => exportReport());

    document.getElementById('activity-filter')?.addEventListener('change', e => {
      renderActivityPage(e.target.value);
    });

    // ── Scanner ──────────────────────────────────────────────
    document.getElementById('btn-start-scanner')?.addEventListener('click', () => startScanner());
    document.getElementById('btn-stop-scanner')?.addEventListener('click', () => stopScanner());
    document.getElementById('btn-mode-entrada')?.addEventListener('click', () => setScanMode('ENTRADA'));
    document.getElementById('btn-mode-salida')?.addEventListener('click', () => setScanMode('SALIDA'));

    document.getElementById('btn-manual-register')?.addEventListener('click', () => {
      const code = document.getElementById('manual-code')?.value.trim();
      if (code) processCode(code);
    });

    document.getElementById('manual-code')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const code = e.target.value.trim();
        if (code) processCode(code);
      }
    });

    document.getElementById('btn-enter-kiosk')?.addEventListener('click', () => enterKiosk());
    document.getElementById('kiosk-exit-btn')?.addEventListener('click', () => exitKiosk());

    // ── Carné / Barcode ──────────────────────────────────────
    document.getElementById('btn-download-barcode')?.addEventListener('click', () => {
      const svg = document.getElementById('barcode-svg');
      if (!svg) return;
      try {
        const data = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([data], { type: 'image/svg+xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'carne_estudiantil.svg';
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (_) {}
    });

    // ── Config: clicks en items ──────────────────────────────
    document.getElementById('config-kiosk')?.addEventListener('click', () => {
      showPage('scanner');
    });
    document.getElementById('config-reports')?.addEventListener('click', () => {
      showPage('reports');
    });
    document.getElementById('config-whatsapp')?.addEventListener('click', () => {
      showPage('whatsapp');
    });
    document.getElementById('config-db')?.addEventListener('click', () => {
      const overlay = document.getElementById('setup-overlay');
      if (overlay) overlay.style.display = 'flex';
    });

    // ── Carga inicial: dashboard ─────────────────────────────
    showPage('dashboard');
    await loadDashboardStats();
    markPageLoaded('dashboard');

  } catch (e) {
    notifyError(e, 'Error iniciando la aplicación.');
  } finally {
    hideLoader();
  }
}
