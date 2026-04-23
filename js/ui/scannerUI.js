import { clearNode, el } from './dom.js';
import { formatTime } from '../utils.js';
import { getAvatarStyle } from '../ui.js';

export function setScanModeUI(mode) {
  const entrada = document.getElementById('btn-mode-entrada');
  const salida = document.getElementById('btn-mode-salida');

  if (entrada) {
    entrada.style.borderColor = mode === 'ENTRADA' ? '#22c55e' : 'rgba(255,255,255,0.2)';
    entrada.style.background = mode === 'ENTRADA' ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0.4)';
    entrada.style.color = mode === 'ENTRADA' ? '#22c55e' : 'rgba(255,255,255,0.5)';
  }

  if (salida) {
    salida.style.borderColor = mode === 'SALIDA' ? '#ef4444' : 'rgba(255,255,255,0.2)';
    salida.style.background = mode === 'SALIDA' ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.4)';
    salida.style.color = mode === 'SALIDA' ? '#ef4444' : 'rgba(255,255,255,0.5)';
  }
}

export function showScannerState(active) {
  const idle = document.getElementById('scanner-idle');
  const activeNode = document.getElementById('scanner-active');
  if (idle) idle.style.display = active ? 'none' : 'flex';
  if (activeNode) activeNode.style.display = active ? 'block' : 'none';
}

export function showScanResult(student, group, mode, code, time = '') {
  const result = document.getElementById('scan-result');
  if (!result) return;

  const avatar = document.getElementById('scan-avatar');
  const name = document.getElementById('scan-name');
  const groupEl = document.getElementById('scan-group');
  const type = document.getElementById('scan-type');
  const timeEl = document.getElementById('scan-time');

  if (!student) {
    if (avatar) {
      avatar.textContent = '?';
      avatar.style.background = '#ef4444';
      avatar.style.color = '#fff';
    }
    if (name) name.textContent = `Codigo: ${code}`;
    if (groupEl) groupEl.textContent = 'Alumno no registrado';
    if (type) {
      type.textContent = 'No encontrado';
      type.style.color = '#ef4444';
      type.style.fontWeight = '700';
    }
    if (timeEl) timeEl.textContent = '';
  } else {
    const avatarData = getAvatarStyle(student.name);
    if (avatar) {
      avatar.textContent = avatarData.initials;
      avatar.style.background = avatarData.bg;
      avatar.style.color = avatarData.color;
    }
    if (name) name.textContent = `${student.name} ${student.lastname || ''}`.trim();
    if (groupEl) groupEl.textContent = group?.name || 'Sin grupo';
    if (type) {
      type.textContent = mode;
      type.style.color = mode === 'ENTRADA' ? '#00d4aa' : '#f59e0b';
      type.style.fontWeight = '700';
    }
    if (timeEl) timeEl.textContent = time;
  }

  result.style.transform = 'translateY(0)';
  setTimeout(() => {
    result.style.transform = 'translateY(100%)';
  }, 3500);
}

export function renderTodayRecordsUI(records) {
  const tbody = document.getElementById('today-records');
  if (!tbody) return;
  clearNode(tbody);

  if (!records.length) {
    const row = el('tr');
    row.append(el('td', {
      attrs: { colspan: '3' },
      text: 'Sin registros hoy',
      style: { color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px' },
    }));
    tbody.append(row);
    return;
  }

  records.forEach((record) => {
    const row = el('tr');
    const name = `${record.students?.name || ''} ${record.students?.lastname || ''}`.trim() || '—';
    const color = record.type === 'ENTRADA' ? '#00d4aa' : '#f59e0b';

    row.append(
      el('td', { text: name, style: { padding: '8px 0', fontSize: '13px', color: 'white' } }),
      el('td', { text: record.type, style: { padding: '8px 0', fontSize: '12px', color, fontWeight: '700' } }),
      el('td', { text: formatTime(record.timestamp), style: { padding: '8px 0', fontSize: '12px', color: '#64748b' } }),
    );

    tbody.append(row);
  });
}
