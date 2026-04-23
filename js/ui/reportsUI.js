import { clearNode, el } from './dom.js';
import { formatDate, formatDateTime, formatTime, percentColor } from '../utils.js';

export function renderReportBars(model) {
  const container = document.getElementById('report-bars');
  if (!container) return;
  clearNode(container);

  if (!model.summary.length) {
    container.append(el('p', {
      text: 'Sin datos',
      style: { color: 'var(--muted)', textAlign: 'center', padding: '20px' },
    }));
    return;
  }

  model.summary.slice(0, 10).forEach((item) => {
    const row = el('div', { className: 'report-bar-row' });
    row.append(
      el('div', { className: 'report-bar-label', text: `${item.student.name} ${item.student.lastname || ''}`.trim(), attrs: { title: `${item.student.name} ${item.student.lastname || ''}`.trim() } }),
    );

    const track = el('div', { className: 'report-bar-track' });
    track.append(el('div', {
      className: 'report-bar-fill',
      style: {
        width: `${item.percentage}%`,
        background: item.percentage >= 80 ? '#22c55e' : item.percentage >= 60 ? '#f59e0b' : '#ef4444',
      },
    }));
    row.append(track);
    row.append(el('div', { className: 'report-bar-pct', text: `${item.percentage}%`, style: { color: percentColor(item.percentage) } }));
    container.append(row);
  });
}

export function renderReportTable(model) {
  const tbody = document.getElementById('report-tbody');
  if (!tbody) return;
  clearNode(tbody);

  if (!model.summary.length) {
    const row = el('tr');
    row.append(el('td', {
      attrs: { colspan: '4' },
      text: 'Sin datos',
      style: { textAlign: 'center', color: 'var(--muted)', padding: '20px' },
    }));
    tbody.append(row);
    return;
  }

  model.summary.forEach((item) => {
    const row = el('tr');
    row.append(
      el('td', { text: `${item.student.name} ${item.student.lastname || ''}`.trim() }),
      el('td', { text: String(item.present), style: { color: 'var(--success)', fontWeight: '600' } }),
      el('td', { text: String(item.absent), style: { color: 'var(--danger)', fontWeight: '600' } }),
      el('td', { text: `${item.percentage}%`, style: { color: percentColor(item.percentage), fontWeight: '700' } }),
    );
    tbody.append(row);
  });
}

export function renderDashboardStatsCards({ total, entered, exited, absent }) {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;
  clearNode(grid);

  const stats = [
    { label: 'Total Alumnos', value: total, sub: 'registrados', cls: 'blue' },
    { label: 'Entradas Hoy', value: entered, sub: 'registradas hoy', cls: 'green' },
    { label: 'Salidas Hoy', value: exited, sub: 'registradas hoy', cls: 'yellow' },
    { label: 'Ausentes Hoy', value: absent, sub: 'sin registro', cls: 'red' },
  ];

  stats.forEach((stat) => {
    const card = el('div', { className: `stat-card ${stat.cls}` });
    card.append(
      el('div', { className: 'stat-label', text: stat.label }),
      el('div', { className: 'stat-value', text: String(stat.value) }),
      el('div', { className: 'stat-sub', text: stat.sub }),
    );
    grid.append(card);
  });
}

export function renderDashboardActivity(records) {
  const container = document.getElementById('dashboard-activity');
  if (!container) return;
  clearNode(container);

  if (!records.length) {
    const empty = el('div', { className: 'empty-state' });
    empty.append(el('div', { className: 'empty-state-desc', text: 'Sin actividad hoy' }));
    container.append(empty);
    return;
  }

  records.forEach((record) => container.append(createActivityItem(record, true)));
}

export function renderActivityPageUI(records) {
  const container = document.getElementById('full-activity-list');
  if (!container) return;
  clearNode(container);

  if (!records.length) {
    container.append(el('div', {
      text: 'Sin registros',
      style: { color: 'var(--muted)', textAlign: 'center', padding: '40px' },
    }));
    return;
  }

  records.forEach((record) => container.append(createActivityItem(record, false)));
}

function createActivityItem(record, compact) {
  const icon = record.type === 'ENTRADA' ? '🟢' : '🟡';
  const cls = record.type === 'ENTRADA' ? 'in' : 'out';
  const name = `${record.students?.name || ''} ${record.students?.lastname || ''}`.trim() || '—';
  const item = el('div', { className: 'activity-item' });
  item.append(
    el('div', { className: `activity-icon ${cls}`, text: icon }),
  );

  const info = el('div', { className: 'activity-info' });
  info.append(
    el('div', { className: 'activity-name', text: name }),
    el('div', {
      className: 'activity-detail',
      text: compact ? record.type : `${record.type} · ${formatDate(new Date(record.timestamp).toISOString().split('T')[0])}`,
    }),
  );
  item.append(info);
  item.append(el('div', { className: 'activity-time', text: compact ? formatTime(record.timestamp) : formatTime(record.timestamp) }));
  return item;
}

export function renderGroupAttendanceBars(metrics) {
  const container = document.getElementById('group-attendance-bars');
  if (!container) return;
  clearNode(container);

  metrics.forEach((item) => {
    const row = el('div', { className: 'report-bar-row' });
    const track = el('div', { className: 'report-bar-track' });
    track.append(el('div', {
      className: 'report-bar-fill',
      style: {
        width: `${item.percentage}%`,
        background: item.percentage >= 80 ? '#22c55e' : item.percentage >= 60 ? '#f59e0b' : '#ef4444',
      },
    }));
    row.append(
      el('div', { className: 'report-bar-label', text: item.group.name, attrs: { title: item.group.name } }),
      track,
      el('div', { className: 'report-bar-pct', text: `${item.percentage}%` }),
    );
    container.append(row);
  });
}

export function populateReportGroupsUI(groups) {
  const select = document.getElementById('report-group');
  if (!select) return;
  clearNode(select);
  select.append(el('option', { attrs: { value: '' }, text: 'Todos los grupos' }));
  groups.forEach((group) => {
    select.append(el('option', { attrs: { value: group.id }, text: group.name }));
  });
}
