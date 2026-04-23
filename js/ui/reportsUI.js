import { deleteAttendance } from '../services/attendanceService.js';
import { showToast } from '../ui.js';

function createActivityItem(record, compact) {
  const icon = record.type === 'ENTRADA' ? '🟢' : '🟡';
  const cls = record.type === 'ENTRADA' ? 'in' : 'out';
  const name = `${record.students?.name || ''} ${record.students?.lastname || ''}`.trim() || '—';

  const item = el('div', { className: 'activity-item' });

  // icono
  item.append(
    el('div', { className: `activity-icon ${cls}`, text: icon }),
  );

  // info
  const info = el('div', { className: 'activity-info' });
  info.append(
    el('div', { className: 'activity-name', text: name }),
    el('div', {
      className: 'activity-detail',
      text: compact
        ? record.type
        : `${record.type} · ${formatDate(new Date(record.timestamp).toISOString().split('T')[0])}`,
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

  // 🔥 BOTÓN ELIMINAR
  const deleteBtn = el('button', {
    className: 'btn-delete',
    text: '🗑',
    attrs: { title: 'Eliminar asistencia' }
  });

  deleteBtn.addEventListener('click', async () => {
    const confirmDelete = confirm('¿Eliminar esta asistencia?');
    if (!confirmDelete) return;

    try {
      await deleteAttendance(record.id);

      showToast('Asistencia eliminada ✅', 'success');

      // eliminar visualmente
      item.remove();

    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  item.append(deleteBtn);

  return item;
}
