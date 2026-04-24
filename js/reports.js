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


// 🔥 FIX: función que faltaba
export function populateReportGroups(groups = []) {
  const select = document.getElementById('report-group');
  if (!select) return;

  select.innerHTML = '<option value="">Todos los grupos</option>';

  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    select.appendChild(option);
  });
}


// 🔥 FIX: función que faltaba
export async function renderActivityPage(filter = '') {
  try {
    const data = await fetchRecentActivity({ type: filter });
    renderActivityPageUI(data);
  } catch (error) {
    notifyError(error, 'Error cargando actividad');
  }
}


// 🔥 DASHBOARD
export async function loadDashboardStats() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });

    const attendance = await fetchRecentActivity({ todayOnly: true });
    const groups = buildDashboardGroupMetrics(attendance, getGroups());

    renderDashboardActivity(attendance);
    renderGroupAttendanceBars(groups);

    renderDashboardStatsCards({
      total: getStudents().length,
      entered: attendance.filter(r => r.type === 'ENTRADA').length,
      exited: attendance.filter(r => r.type === 'SALIDA').length,
      absent: 0
    });

  } catch (error) {
    notifyError(error, 'Error cargando dashboard');
  }
}


// 🔥 REPORTES
export async function loadReportsPage() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    populateReportGroups(getGroups());
  } catch (error) {
    notifyError(error, 'No se pudo cargar reportes');
  }
}


export async function generateReport() {
  const from = document.getElementById('report-from')?.value;
  const to = document.getElementById('report-to')?.value;
  const groupId = document.getElementById('report-group')?.value;

  if (!from || !to) {
    showToast('Selecciona fechas', 'warning');
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
  showToast('Exportación lista (pendiente XLSX)', 'success');
}
