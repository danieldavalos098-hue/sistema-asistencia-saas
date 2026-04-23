import { getGroup, getGroups, getStudents } from './studentService.js';

export function buildReportModel({ students, attendance }) {
  const entryRecords = attendance.filter((record) => record.type === 'ENTRADA');
  const dates = [...new Set(entryRecords.map((record) => record.timestamp.split('T')[0]))].sort();

  const summary = students.map((student) => {
    const present = dates.filter((date) =>
      entryRecords.some((record) => record.student_id === student.id && record.timestamp.startsWith(date))
    ).length;

    const absent = Math.max(0, dates.length - present);
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

export function buildDashboardGroupMetrics(records) {
  const enteredIds = new Set(records.filter((record) => record.type === 'ENTRADA').map((record) => record.student_id));
  return getGroups().map((group) => {
    const students = getStudents().filter((student) => student.group_id === group.id);
    const present = students.filter((student) => enteredIds.has(student.id)).length;
    const percentage = students.length ? Math.round((present / students.length) * 100) : 0;
    return { group, present, total: students.length, percentage };
  });
}
