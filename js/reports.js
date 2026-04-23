import { fetchAttendance, fetchRecentActivity } from './services/attendanceService.js';
import { buildDashboardGroupMetrics, buildReportModel } from './services/reportService.js';
import { ensureStudentDataLoaded, getGroups, getStudents } from './services/studentService.js';
import { sendAbsentNotifications } from './services/whatsappService.js';
import { notifyError, showToast } from './ui.js';
import {
  populateReportGroupsUI,
  renderActivityPageUI,
  renderDashboardActivity,
  renderDashboardStatsCards,
  renderGroupAttendanceBars,
  renderReportBars,
  renderReportTable,
} from './ui/reportsUI.js';

export async function loadReportsPage() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    populateReportGroupsUI(getGroups());
  } catch (error) {
    notifyError(error, 'No se pudo cargar la página de reportes.');
  }
}

export async function generateReport() {
  const from = document.getElementById('report-from')?.value;
  const to = document.getElementById('report-to')?.value;
  const groupId = document.getElementById('report-group')?.value;

  if (!from || !to) {
    showToast('Selecciona el rango de fechas.', 'warning');
    return;
  }

  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    const attendance = await fetchAttendance({ from, to, groupId });
    const students = groupId ? getStudents().filter((student) => student.group_id === groupId) : getStudents();
    const model = buildReportModel({ students, attendance });
    renderReportBars(model);
    renderReportTable(model);
  } catch (error) {
    notifyError(error, 'No se pudo generar el reporte.');
  }
}

export async function exportReport() {
  if (!window.XLSX) {
    showToast('Libreria Excel no disponible.', 'warning');
    return;
  }

  const from = document.getElementById('report-from')?.value;
  const to = document.getElementById('report-to')?.value;
  const groupId = document.getElementById('report-group')?.value;

  if (!from || !to) {
    showToast('Selecciona el rango de fechas.', 'warning');
    return;
  }

  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    const attendance = await fetchAttendance({ from, to, groupId });
    const students = groupId ? getStudents().filter((student) => student.group_id === groupId) : getStudents();
    const model = buildReportModel({ students, attendance });

    const workbook = window.XLSX.utils.book_new();
    const summaryRows = [['N°', 'Alumno', 'Grupo', 'Presentes', 'Ausentes', '% Asistencia']];
    model.summary.forEach((item, index) => {
      summaryRows.push([
        index + 1,
        `${item.student.name} ${item.student.lastname || ''}`.trim(),
        item.group?.name || '—',
        item.present,
        item.absent,
        `${item.percentage}%`,
      ]);
    });

    const detailRows = [['Alumno', 'Grupo', ...model.dates]];
    model.summary.forEach((item) => {
      detailRows.push([
        `${item.student.name} ${item.student.lastname || ''}`.trim(),
        item.group?.name || '—',
        ...model.dates.map((date) =>
          model.entryRecords.some((record) => record.student_id === item.student.id && record.timestamp.startsWith(date)) ? 'P' : 'A'
        ),
      ]);
    });

    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.aoa_to_sheet(summaryRows), 'Resumen');
    window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.aoa_to_sheet(detailRows), 'Detalle');
    window.XLSX.writeFile(workbook, `Reporte_Asistencia_${from}_${to}.xlsx`);
    showToast('Excel exportado ✅', 'success');
  } catch (error) {
    notifyError(error, 'No se pudo exportar el reporte.');
  }
}

export async function loadDashboardStats() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    const records = await fetchAttendance({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
    const entered = new Set(records.filter((record) => record.type === 'ENTRADA').map((record) => record.student_id)).size;
    const exited = new Set(records.filter((record) => record.type === 'SALIDA').map((record) => record.student_id)).size;
    const total = getStudents().length;
    const absent = Math.max(0, total - entered);

    renderDashboardStatsCards({ total, entered, exited, absent });
    renderGroupAttendanceBars(buildDashboardGroupMetrics(records));
    renderDashboardActivity(await fetchRecentActivity({ todayOnly: true, limit: 10 }));
  } catch (error) {
    notifyError(error, 'No se pudieron cargar las estadisticas.');
  }
}

export async function renderActivityPage(filter = '') {
  try {
    renderActivityPageUI(await fetchRecentActivity({ type: filter, limit: 100 }));
  } catch (error) {
    notifyError(error, 'No se pudo cargar la actividad.');
  }
}

export function populateReportGroups(groups = getGroups()) {
  populateReportGroupsUI(groups);
}

export async function sendTodayAbsentNotifications() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: false });
    const todayRecords = await fetchAttendance({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
    const presentIds = new Set(todayRecords.filter((record) => record.type === 'ENTRADA').map((record) => record.student_id));
    const result = await sendAbsentNotifications(presentIds);
    showToast(`✅ ${result.sent} notificaciones enviadas${result.errors ? `, ❌ ${result.errors} errores` : ''}.`, result.errors ? 'warning' : 'success');
  } catch (error) {
    notifyError(error, 'No se pudieron enviar las notificaciones.');
  }
}
