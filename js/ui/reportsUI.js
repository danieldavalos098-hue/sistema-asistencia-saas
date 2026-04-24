import { deleteAttendance } from '../services/attendanceService.js';
import { showToast } from '../ui.js';


// 🔧 helpers básicos (por si no existen globales)
function el(tag, { className = '', text = '', attrs = {} } = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  Object.entries(attrs).forEach(([k, v]) => element.setAttribute(k, v));
  return element;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}


// =============================
// 🔥 ITEM DE ACTIVIDAD
// =============================
function createActivityItem(record, compact = false) {
  const icon = record.type === 'ENTRADA' ? '🟢' : '🟡';
  const cls = record.type === 'ENTRADA' ? 'in' : 'out';
  const name = `${record.students?.name || ''} ${record.students?.lastname || ''}`.trim() || '—';

  const item = el('div', { className: 'activity-item' });

  // icono
  item.append(
    el('div', { className: `activity-icon ${cls}`, text: icon })
  );

  // info
  const info = el('div', { className: 'activity-info' });
  info.append(
    el('div', { className: 'activity-name', text: name }),
    el('div', {
      className: 'activity-detail',
      text: compact
        ? record.type
        : `${record.type} · ${formatDate(record.timestamp)}`,
    }),
  );

  item.append(info);

  // hora
  item.append(
    el('div', {
      className: 'activity-time',
      text: formatTime(record.timestamp),
    })
  );

  // 🗑 eliminar
  const deleteBtn = el('button', {
    className: 'btn-delete',
    text: '🗑',
    attrs: { title: 'Eliminar asistencia' }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta asistencia?')) return;

    try {
      await deleteAttendance(record.id);
      showToast('Asistencia eliminada ✅', 'success');
      item.remove();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  item.append(deleteBtn);

  return item;
}


// =============================
// 📊 DASHBOARD ACTIVIDAD
// =============================
export function renderDashboardActivity(data = []) {
  const container = document.getElementById('dashboard-activity');
  if (!container) return;

  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = '<p style="opacity:.6">Sin actividad</p>';
    return;
  }

  data.forEach(record => {
    container.append(createActivityItem(record, true));
  });
}


// =============================
// 📊 ACTIVITY PAGE (🔥 ESTA FALTABA)
// =============================
export function renderActivityPageUI(data = []) {
  const container = document.getElementById('activity-container');
  if (!container) return;

  container.innerHTML = '';

  if (!data.length) {
    container.innerHTML = '<p style="opacity:.6">Sin actividad reciente</p>';
    return;
  }

  data.forEach(record => {
    container.append(createActivityItem(record, false));
  });
}


// =============================
// 📊 DASHBOARD CARDS
// =============================
export function renderDashboardStatsCards({ total, entered, exited, absent }) {
  const elTotal = document.getElementById('stat-total');
  const elIn = document.getElementById('stat-entered');
  const elOut = document.getElementById('stat-exited');
  const elAbsent = document.getElementById('stat-absent');

  if (elTotal) elTotal.textContent = total ?? 0;
  if (elIn) elIn.textContent = entered ?? 0;
  if (elOut) elOut.textContent = exited ?? 0;
  if (elAbsent) elAbsent.textContent = absent ?? 0;
}


// =============================
// 📊 GRUPOS DASHBOARD
// =============================
export function renderGroupAttendanceBars(groups = []) {
  const container = document.getElementById('group-bars');
  if (!container) return;

  container.innerHTML = '';

  groups.forEach(group => {
    const bar = el('div', { className: 'group-bar' });

    bar.append(
      el('div', { text: group.name }),
      el('div', { text: `${group.present}/${group.total}` })
    );

    container.append(bar);
  });
}


// =============================
// 📊 REPORTES
// =============================
export function renderReportBars(model) {
  const container = document.getElementById('report-bars');
  if (!container) return;

  container.innerHTML = `<p style="opacity:.6">Gráfico generado</p>`;
}


export function renderReportTable(model) {
  const container = document.getElementById('report-table');
  if (!container) return;

  container.innerHTML = `<p style="opacity:.6">Tabla generada</p>`;
}
