// ============================================================
// reports.js
// ============================================================

import { fetchAttendance, fetchRecentActivity } from './services/attendanceService.js';
import { buildDashboardGroupMetrics, buildReportModel } from './services/reportService.js';
import { ensureStudentDataLoaded, getGroups, getStudents } from './services/studentService.js';
import { notifyError, showToast } from './ui.js';
import {
  renderActivityPageUI,
  renderDashboardActivity,
  renderDashboardStatsCards,
  renderGroupAttendanceBars,
  renderReportBars,
  renderReportTable,
} from './ui/reportsUI.js';


// ── Poblar select de grupos en reportes ─────────────────────
export function populateReportGroups(groups = []) {
  const select = document.getElementById('report-group');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Todos los grupos</option>';
  groups.forEach(group => {
    const opt = document.createElement('option');
    opt.value = group.id;
    opt.textContent = group.name;
    select.appendChild(opt);
  });
  select.value = current;
}


// ── Página de actividad ─────────────────────────────────────
export async function renderActivityPage(filter = '') {
  try {
    const data = await fetchRecentActivity({ type: filter, limit: 200 });
    renderActivityPageUI(data);
  } catch (error) {
    notifyError(error, 'Error cargando actividad');
  }
}


// ── Dashboard ───────────────────────────────────────────────
export async function loadDashboardStats() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });

    const attendance = await fetchRecentActivity({ todayOnly: true, limit: 500 });
    const groups     = buildDashboardGroupMetrics(attendance);

    renderDashboardActivity(attendance.slice(0, 30));
    renderGroupAttendanceBars(groups);

    const enteredSet = new Set(
      attendance.filter(r => r.type === 'ENTRADA').map(r => r.student_id)
    );
    const total   = getStudents().length;
    const entered = enteredSet.size;
    const exited  = new Set(
      attendance.filter(r => r.type === 'SALIDA').map(r => r.student_id)
    ).size;
    const absent = Math.max(0, total - entered);

    renderDashboardStatsCards({ total, entered, exited, absent });

  } catch (error) {
    notifyError(error, 'Error cargando dashboard');
  }
}


// ── Reportes ────────────────────────────────────────────────
export async function loadReportsPage() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    populateReportGroups(getGroups());
  } catch (error) {
    notifyError(error, 'No se pudo cargar reportes');
  }
}

export async function generateReport() {
  const from    = document.getElementById('report-from')?.value;
  const to      = document.getElementById('report-to')?.value;
  const groupId = document.getElementById('report-group')?.value;

  if (!from || !to) {
    showToast('Selecciona un rango de fechas', 'warning');
    return;
  }

  try {
    const attendance = await fetchAttendance({ from, to, groupId });

    const students = groupId
      ? getStudents().filter(s => s.group_id === groupId)
      : getStudents();

    const model = buildReportModel({ students, attendance });
    renderReportBars(model);
    renderReportTable(model);

  } catch (error) {
    notifyError(error, 'Error generando reporte');
  }
}

export async function exportReport() {
  const from    = document.getElementById('report-from')?.value;
  const to      = document.getElementById('report-to')?.value;
  const groupId = document.getElementById('report-group')?.value;

  if (!from || !to) {
    showToast('Selecciona un rango de fechas primero', 'warning');
    return;
  }

  try {
    const attendance = await fetchAttendance({ from, to, groupId });
    const students   = groupId
      ? getStudents().filter(s => s.group_id === groupId)
      : getStudents();

    const model = buildReportModel({ students, attendance });

    if (!window.XLSX) {
      showToast('Librería XLSX no disponible', 'error');
      return;
    }

    const rows = model.summary.map(r => ({
      Alumno:    `${r.student.name} ${r.student.lastname || ''}`.trim(),
      Grupo:     r.group?.name || '—',
      Presentes: r.present,
      Ausentes:  r.absent,
      'Porcentaje (%)': r.percentage,
    }));

    const ws  = XLSX.utils.json_to_sheet(rows);
    const wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    XLSX.writeFile(wb, `reporte_${from}_${to}.xlsx`);
    showToast('Reporte exportado ✅', 'success');

  } catch (error) {
    notifyError(error, 'Error exportando reporte');
  }
}


// ── Notificaciones de ausentes ──────────────────────────────
export async function sendTodayAbsentNotifications() {
  try {
    const { sendAbsentNotifications } = await import('./services/whatsappService.js');

    await ensureStudentDataLoaded({ students: true });
    const todayRecords = await fetchRecentActivity({ todayOnly: true, limit: 500 });
    const presentIds   = new Set(
      todayRecords.filter(r => r.type === 'ENTRADA').map(r => r.student_id)
    );
    const result = await sendAbsentNotifications(presentIds);
    showToast(`Enviadas: ${result.sent} notificaciones. Errores: ${result.errors}`, 'success');
  } catch (error) {
    notifyError(error, 'No se pudieron enviar las notificaciones.');
  }
}
