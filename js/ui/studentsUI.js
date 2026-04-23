import {
  getEditingGroupId,
  getEditingStudentId,
  getGroupById,
  getGroupsState,
  getStudentById,
  getStudentsState,
  setEditingGroupId,
  setEditingStudentId,
} from '../store/studentStore.js';
import { avatarStyle, clearValues, getValue, setValue } from '../utils.js';
import { clearNode, el } from './dom.js';
import { closeModal, openModal } from '../ui.js';
import { APP_CONFIG } from '../config.js';

export function renderStudentsTableUI({ onEdit, onDelete, onBarcode }, { filter = '', groupId = '' } = {}) {
  const tbody = document.getElementById('students-tbody');
  const countEl = document.getElementById('students-count');
  if (!tbody) return;

  const query = filter.toLowerCase();
  const list = getStudentsState().filter((student) => {
    const fullName = `${student.name} ${student.lastname || ''}`.toLowerCase();
    const matchesQuery = !query || fullName.includes(query) || (student.code || '').toLowerCase().includes(query);
    const matchesGroup = !groupId || student.group_id === groupId;
    return matchesQuery && matchesGroup;
  });

  if (countEl) countEl.textContent = `${list.length} alumno${list.length === 1 ? '' : 's'}`;
  clearNode(tbody);

  if (!list.length) {
    const row = el('tr');
    const cell = el('td', { attrs: { colspan: '6' } });
    cell.append(
      el('div', { className: 'empty-state' }),
    );
    cell.firstChild.append(
      el('div', { className: 'empty-state-icon', text: '🎓' }),
      el('div', { className: 'empty-state-title', text: 'Sin alumnos' }),
      el('div', { className: 'empty-state-desc', text: 'Agrega tu primer alumno con el boton +' }),
    );
    row.append(cell);
    tbody.append(row);
    return;
  }

  list.forEach((student) => {
    const row = el('tr');
    const group = getGroupById(student.group_id);
    const avatar = avatarStyle(student.name);
    const fullName = `${student.name} ${student.lastname || ''}`.trim();

    const studentCell = el('td');
    const cellWrap = el('div', { className: 'student-cell' });
    const avatarNode = el('div', { className: 'avatar', text: avatar.initials, style: { background: avatar.bg, color: avatar.color } });
    const info = el('div', { className: 'student-info' });
    info.append(
      el('div', { className: 'student-name', text: fullName }),
      el('div', { className: 'student-id', text: student.code || '—' }),
    );
    cellWrap.append(avatarNode, info);
    studentCell.append(cellWrap);

    row.append(
      studentCell,
      el('td', { text: group?.name || '—' }),
      el('td', { text: student.phone || '—' }),
      el('td', { text: student.parent_name || '—' }),
    );

    const actionCell = el('td');
    const actions = el('div', { style: { display: 'flex', gap: '8px' } });

    const barcodeButton = el('button', { className: 'btn btn-secondary btn-sm', text: APP_CONFIG.cardTitle });
    barcodeButton.addEventListener('click', () => onBarcode(student.id));

    const editButton = el('button', { className: 'btn btn-secondary btn-sm', text: '✏️' });
    editButton.addEventListener('click', () => onEdit(student.id));

    const deleteButton = el('button', { className: 'btn btn-danger btn-sm', text: '🗑' });
    deleteButton.addEventListener('click', () => onDelete(student.id));

    actions.append(barcodeButton, editButton, deleteButton);
    actionCell.append(actions);
    row.append(actionCell);
    tbody.append(row);
  });
}

export function renderGroupsGridUI({ onEdit, onDelete }) {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;
  clearNode(grid);

  const groups = getGroupsState();
  const students = getStudentsState();

  if (!groups.length) {
    const empty = el('div', { className: 'empty-state', style: { gridColumn: '1/-1' } });
    empty.append(
      el('div', { className: 'empty-state-icon', text: '🛡️' }),
      el('div', { className: 'empty-state-title', text: 'Sin grupos' }),
      el('div', { className: 'empty-state-desc', text: 'Crea el primer grupo para organizar tus alumnos' }),
    );
    grid.append(empty);
    return;
  }

  groups.forEach((group, index) => {
    const count = students.filter((student) => student.group_id === group.id).length;
    const card = el('div', { className: `group-card color-${index % 4}` });
    const header = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } });
    const titleWrap = el('div');
    titleWrap.append(
      el('div', { className: 'group-name', text: group.name }),
      el('div', { className: 'group-meta', text: group.schedule || 'Sin horario' }),
    );

    const buttons = el('div', { style: { display: 'flex', gap: '6px' } });
    const editButton = el('button', { className: 'btn btn-secondary btn-sm', text: '✏️' });
    editButton.addEventListener('click', () => onEdit(group.id));
    const deleteButton = el('button', { className: 'btn btn-danger btn-sm', text: '🗑' });
    deleteButton.addEventListener('click', () => onDelete(group.id));
    buttons.append(editButton, deleteButton);

    header.append(titleWrap, buttons);
    card.append(
      header,
      el('div', { className: 'group-count', text: String(count) }),
      el('div', { className: 'group-meta', text: `alumno${count === 1 ? '' : 's'}` }),
    );
    grid.append(card);
  });
}

export function populateGroupSelectsUI() {
  document.querySelectorAll('.group-select').forEach((select) => {
    const currentValue = select.value;
    clearNode(select);
    select.append(el('option', { attrs: { value: '' }, text: 'Sin grupo' }));
    getGroupsState().forEach((group) => {
      select.append(el('option', { attrs: { value: group.id }, text: group.name }));
    });
    select.value = currentValue;
  });
}

export function openStudentModalUI(studentId = null) {
  setEditingStudentId(studentId);
  document.getElementById('student-modal-title').textContent = studentId ? 'Editar Alumno' : 'Agregar Alumno';

  const groupSelect = document.getElementById('st-group');
  if (groupSelect) {
    clearNode(groupSelect);
    groupSelect.append(el('option', { attrs: { value: '' }, text: 'Sin grupo' }));
    getGroupsState().forEach((group) => {
      groupSelect.append(el('option', { attrs: { value: group.id }, text: group.name }));
    });
  }

  if (studentId) {
    const student = getStudentById(studentId);
    if (student) {
      setValue('st-name', student.name);
      setValue('st-lastname', student.lastname);
      setValue('st-group', student.group_id);
      setValue('st-dob', student.dob);
      setValue('st-parent', student.parent_name);
      setValue('st-phone', student.phone);
    }
  } else {
    clearValues(['st-name', 'st-lastname', 'st-group', 'st-dob', 'st-parent', 'st-phone']);
  }

  openModal('modal-student');
}

export function getStudentModalPayload() {
  return {
    id: getEditingStudentId(),
    payload: {
      name: getValue('st-name'),
      lastname: getValue('st-lastname'),
      group_id: getValue('st-group') || null,
      dob: getValue('st-dob') || null,
      parent_name: getValue('st-parent'),
      phone: getValue('st-phone'),
    },
  };
}

export function closeStudentModalUI() {
  closeModal('modal-student');
}

export function openGroupModalUI(groupId = null) {
  setEditingGroupId(groupId);
  document.getElementById('group-modal-title').textContent = groupId ? 'Editar Grupo' : 'Nuevo Grupo';

  if (groupId) {
    const group = getGroupById(groupId);
    if (group) {
      setValue('grp-name', group.name);
      setValue('grp-shift', group.schedule);
      setValue('grp-teacher', group.teacher);
    }
  } else {
    clearValues(['grp-name', 'grp-shift', 'grp-teacher']);
  }

  openModal('modal-group');
}

export function getGroupModalPayload() {
  return {
    id: getEditingGroupId(),
    payload: {
      name: getValue('grp-name'),
      schedule: getValue('grp-shift'),
      teacher: getValue('grp-teacher'),
    },
  };
}

export function closeGroupModalUI() {
  closeModal('modal-group');
}

export function openBarcodeModalUI(student) {
  document.getElementById('barcode-student-name').textContent = `${student.name} ${student.lastname || ''}`.trim();
  document.getElementById('barcode-id-text').textContent = student.code || '';

  const canvasWrap = document.getElementById('barcode-canvas');
  clearNode(canvasWrap);
  const canvas = document.createElement('canvas');
  canvas.id = 'barcode-cv';
  canvasWrap.append(canvas);

  if (window.JsBarcode) {
    window.JsBarcode('#barcode-cv', student.code, {
      format: 'CODE128',
      lineColor: '#000',
      width: 2,
      height: 60,
      displayValue: false,
    });
  }

  openModal('modal-barcode');
}
