// ============================================================
// students.js
// ============================================================

import {
  createGroup,
  createStudent,
  deleteGroup,
  deleteStudent,
  ensureStudentDataLoaded,
  findStudentByCode,
  getGroup,
  getGroups,
  getStudent,
  getStudents,
  updateGroup,
  updateStudent,
} from './services/studentService.js';
import { notifyError, showToast } from './ui.js';
import {
  closeGroupModalUI,
  closeStudentModalUI,
  getGroupModalPayload,
  getStudentModalPayload,
  openBarcodeModalUI,
  openGroupModalUI,
  openStudentModalUI,
  populateGroupSelectsUI,
  renderGroupsGridUI,
  renderStudentsTableUI,
} from './ui/studentsUI.js';

export { getStudents, getGroups, getStudent, getGroup, findStudentByCode };


// ── Carga de páginas ─────────────────────────────────────────
export async function loadStudentsPage() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    populateGroupSelects();
    renderStudentsTable();
    renderGroupsGrid();
  } catch (error) {
    notifyError(error, 'No se pudo cargar la página de alumnos.');
  }
}

export async function loadGroupsPage() {
  try {
    await ensureStudentDataLoaded({ students: true, groups: true });
    populateGroupSelects();
    renderGroupsGrid();
  } catch (error) {
    notifyError(error, 'No se pudo cargar la página de grupos.');
  }
}


// ── Render ───────────────────────────────────────────────────
export function renderStudentsTable(filter = '', groupId = '') {
  renderStudentsTableUI(
    { onEdit: openStudentModal, onDelete: confirmDeleteStudent, onBarcode: openBarcodeModal },
    { filter, groupId }
  );
}

export function renderGroupsGrid() {
  renderGroupsGridUI({ onEdit: openGroupModal, onDelete: confirmDeleteGroup });
}

export function populateGroupSelects() {
  populateGroupSelectsUI();
}


// ── Modal Alumno ─────────────────────────────────────────────
export function openStudentModal(studentId = null) {
  populateGroupSelectsUI();
  openStudentModalUI(studentId);
}

export async function saveStudentFromModal() {
  const { id, payload } = getStudentModalPayload();
  if (!payload.name) {
    showToast('El nombre es obligatorio.', 'error');
    return;
  }
  try {
    if (id) {
      await updateStudent(id, payload);
      showToast('Alumno actualizado ✅', 'success');
    } else {
      await createStudent(payload);
      showToast('Alumno agregado ✅', 'success');
    }
    closeStudentModalUI();
    renderStudentsTable();
    renderGroupsGrid();
  } catch (error) {
    notifyError(error, 'No se pudo guardar el alumno.');
  }
}

async function confirmDeleteStudent(id) {
  const student = getStudent(id);
  if (!student) return;
  if (!confirm(`¿Eliminar a ${student.name} ${student.lastname || ''}? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteStudent(id);
    showToast('Alumno eliminado.', 'success');
    renderStudentsTable();
    renderGroupsGrid();
  } catch (error) {
    notifyError(error, 'No se pudo eliminar el alumno.');
  }
}


// ── Modal Grupo ──────────────────────────────────────────────
export function openGroupModal(groupId = null) {
  openGroupModalUI(groupId);
}

export async function saveGroupFromModal() {
  const { id, payload } = getGroupModalPayload();
  if (!payload.name) {
    showToast('El nombre del grupo es obligatorio.', 'error');
    return;
  }
  try {
    if (id) {
      await updateGroup(id, payload);
      showToast('Grupo actualizado ✅', 'success');
    } else {
      await createGroup(payload);
      showToast('Grupo creado ✅', 'success');
    }
    closeGroupModalUI();
    renderGroupsGrid();
    populateGroupSelects();
  } catch (error) {
    notifyError(error, 'No se pudo guardar el grupo.');
  }
}

async function confirmDeleteGroup(id) {
  const group = getGroup(id);
  if (!group) return;
  if (!confirm(`¿Eliminar el grupo "${group.name}"?`)) return;
  try {
    await deleteGroup(id);
    showToast('Grupo eliminado.', 'success');
    renderGroupsGrid();
    populateGroupSelects();
  } catch (error) {
    notifyError(error, 'No se pudo eliminar el grupo.');
  }
}


// ── Modal Carné ──────────────────────────────────────────────
export function openBarcodeModal(studentId) {
  const student = getStudent(studentId);
  if (!student) return;
  openBarcodeModalUI(student);
}
