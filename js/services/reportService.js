// ============================================================
// services/reportService.js
// ============================================================

import { getGroup, getGroups, getStudents } from './studentService.js';

export function buildReportModel({ students, attendance }) {
  const entryRecords = attendance.filter(r => r.type === 'ENTRADA');
  const dates = [...new Set(entryRecords.map(r => r.timestamp.split('T')[0]))].sort();

  const summary = students.map(student => {
    const present = dates.filter(date =>
      entryRecords.some(r => r.student_id === student.id && r.timestamp.startsWith(date))
    ).length;

    const absent     = Math.max(0, dates.length - present);
    const percentage = dates.length ? Math.round((present / dates.length) * 100) : 0;

    return {
      student,
      group: getGroup(student.group_id),
      present,
      absent,
      percentage,
    };
  });

  return { dates, summary, entryRecords };
}

// Acepta records y usa el store para grupos/alumnos
export function buildDashboardGroupMetrics(records) {
  const enteredIds = new Set(
    records.filter(r => r.type === 'ENTRADA').map(r => r.student_id)
  );

  return getGroups().map(group => {
    const groupStudents = getStudents().filter(s => s.group_id === group.id);
    const present    = groupStudents.filter(s => enteredIds.has(s.id)).length;
    const total      = groupStudents.length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    return { group, present, total, percentage };
  });
}
