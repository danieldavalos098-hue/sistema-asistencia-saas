// ============================================================
// ui/reportsUI.js
// ============================================================

import { deleteAttendance } from '../services/attendanceService.js';
import { showToast } from '../ui.js';
import { el } from './dom.js';

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE');
}

function pctColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}


// ── Item de actividad ────────────────────────────────────────
function createActivityItem(record, compact = false) {
  const icon = record.type === 'ENTRADA' ? '🟢' : '🟡';
  const cls  = record.type === 'ENTRADA' ? 'in' : 'out';
  const name = `${record.students?.name || ''} ${record.students?.lastname || ''}`.trim() || '—';

  const item = el('div', { className: 'activity-item' });
  item.append(el('div', { className: `activity-icon ${cls}`, text: icon }));

  const info = el('div', { className: 'activity-info' });
  info.append(
    el('div', { className: 'activity-name', text: name }),
    el('div', {
      className: 'activity-detail',
      text: compact ? record.type : `${record.type} · ${formatDate(record.timestamp)}`,
    }),
  );
  item.append(info);

  item.append(el('div', { className: 'activity-time', text: formatTime(record.timestamp) }));

  const deleteBtn = el('button', { className: 'btn-delete', text: '🗑', attrs: { title: 'Eliminar' } });
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


// ── Dashboard: actividad reciente ────────────────────────────
export function renderDashboardActivity(data = []) {
  const container = document.getElementById('dashboard-activity');
  if (!container) return;
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<p style="opacity:.6;padding:16px">Sin actividad hoy</p>';
    return;
  }
  data.slice(0, 20).forEach(record => container.append(createActivityItem(record, true)));
}


// ── Página Actividad ──────────────────────────────────────────
// HTML id: full-activity-list
export function renderActivityPageUI(data = []) {
  const container = document.getElementById('full-activity-list');
  if (!container) return;
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<p style="opacity:.6;padding:16px">Sin actividad reciente</p>';
    return;
  }
  data.forEach(record => container.append(createActivityItem(record, false)));
}


// ── Dashboard: cards de estadísticas ─────────────────────────
// HTML id: stats-grid (renderizamos dentro)
export function renderDashboardStatsCards({ total, entered, exited, absent }) {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${total ?? 0}</div>
      <div class="stat-label">Total Alumnos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#22c55e">${entered ?? 0}</div>
      <div class="stat-label">Entradas Hoy</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#f59e0b">${exited ?? 0}</div>
      <div class="stat-label">Salidas Hoy</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#ef4444">${absent ?? 0}</div>
      <div class="stat-label">Ausentes</div>
    </div>
  `;
}


// ── Dashboard: barras por grupo ──────────────────────────────
// HTML id: group-attendance-bars
export function renderGroupAttendanceBars(groups = []) {
  const container = document.getElementById('group-attendance-bars');
  if (!container) return;
  container.innerHTML = '';

  if (!groups.length) {
    container.innerHTML = '<p style="opacity:.6;padding:16px">Sin grupos</p>';
    return;
  }

  groups.forEach(({ group, present, total, percentage }) => {
    const wrap = el('div', { style: { marginBottom: '12px' } });

    const labelRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' } });
    labelRow.append(
      el('span', { text: group.name }),
      el('span', { text: `${present}/${total} (${percentage}%)`, style: { color: pctColor(percentage) } }),
    );

    const barBg = el('div', { style: { background: 'var(--surface2)', borderRadius: '6px', height: '8px', overflow: 'hidden' } });
    const barFg = el('div', { style: { height: '8px', borderRadius: '6px', background: pctColor(percentage), width: `${percentage}%`, transition: 'width .4s' } });
    barBg.append(barFg);

    wrap.append(labelRow, barBg);
    container.append(wrap);
  });
}


// ── Reportes: barras ─────────────────────────────────────────
// HTML id: report-bars
export function renderReportBars(model) {
  const container = document.getElementById('report-bars');
  if (!container) return;
  container.innerHTML = '';

  if (!model.summary.length) {
    container.innerHTML = '<p style="opacity:.6;padding:16px">Sin datos</p>';
    return;
  }

  const sorted = [...model.summary].sort((a, b) => b.percentage - a.percentage);

  sorted.forEach(({ student, percentage }) => {
    const name = `${student.name} ${student.lastname || ''}`.trim();
    const wrap = el('div', { style: { marginBottom: '10px' } });

    const labelRow = el('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' } });
    labelRow.append(
      el('span', { text: name }),
      el('span', { text: `${percentage}%`, style: { color: pctColor(percentage), fontWeight: '700' } }),
    );

    const barBg = el('div', { style: { background: 'var(--surface2)', borderRadius: '6px', height: '8px', overflow: 'hidden' } });
    const barFg = el('div', { style: { height: '8px', borderRadius: '6px', background: pctColor(percentage), width: `${percentage}%` } });
    barBg.append(barFg);

    wrap.append(labelRow, barBg);
    container.append(wrap);
  });
}


// ── Reportes: tabla ──────────────────────────────────────────
// HTML id: report-tbody
export function renderReportTable(model) {
  const tbody = document.getElementById('report-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!model.summary.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="4" style="text-align:center;opacity:.6;padding:16px">Sin datos para el rango seleccionado</td>`;
    tbody.append(row);
    return;
  }

  model.summary.forEach(({ student, present, absent, percentage }) => {
    const name = `${student.name} ${student.lastname || ''}`.trim();
    const row  = document.createElement('tr');
    row.innerHTML = `
      <td>${name}</td>
      <td>${present}</td>
      <td>${absent}</td>
      <td style="font-weight:700;color:${pctColor(percentage)}">${percentage}%</td>
    `;
    tbody.append(row);
  });
}
