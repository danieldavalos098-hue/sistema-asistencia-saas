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
    const matchesQuery =
      !query ||
      fullName.includes(query) ||
      (student.code || '').toLowerCase().includes(query);

    const matchesGroup = !groupId || student.group_id === groupId;

    return matchesQuery && matchesGroup;
  });

  if (countEl) {
    countEl.textContent = `${list.length} alumno${list.length === 1 ? '' : 's'}`;
  }

  clearNode(tbody);

  if (!list.length) {
    const row = el('tr');
    const cell = el('td', { attrs: { colspan: '6' } });

    const empty = el('div', { className: 'empty-state' });
    empty.append(
      el('div', { className: 'empty-state-icon', text: '🎓' }),
      el('div', { className: 'empty-state-title', text: 'Sin alumnos' }),
      el('div', { className: 'empty-state-desc', text: 'Agrega tu primer alumno con el botón +' })
    );

    cell.append(empty);
    row.append(cell);
    tbody.append(row);
    return;
  }

  list.forEach((student) => {
    const row = el('tr');

    const group = getGroupById(student.group_id);
    const avatar = avatarStyle(student.name);
    const fullName = `${student.name} ${student.lastname || ''}`.trim();

    // 📌 alumno
    const studentCell = el('td');

    const cellWrap = el('div', { className: 'student-cell' });

    const avatarNode = el('div', {
      className: 'avatar',
      text: avatar.initials,
      style: {
        background: avatar.bg,
        color: avatar.color,
      },
    });

    const info = el('div', { className: 'student-info' });

    info.append(
      el('div', { className: 'student-name', text: fullName }),
      el('div', { className: 'student-id', text: student.code || '—' })
    );

    cellWrap.append(avatarNode, info);
    studentCell.append(cellWrap);

    // 📌 columnas
    row.append(
      studentCell,
      el('td', { text: group?.name || '—' }),
      el('td', { text: student.phone || '—' }),
      el('td', { text: student.parent_name || '—' })
    );

    // 📌 acciones
    const actionCell = el('td');

    const actions = el('div', {
      className: 'student-actions'
    });

    const barcodeButton = el('button', {
      className: 'btn btn-secondary btn-sm',
      text: '🪪'
    });

    const editButton = el('button', {
      className: 'btn btn-secondary btn-sm',
      text: '✏️'
    });

    const deleteButton = el('button', {
      className: 'btn btn-danger btn-sm',
      text: '🗑'
    });

    barcodeButton.addEventListener('click', () => onBarcode(student.id));
    editButton.addEventListener('click', () => onEdit(student.id));
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
      el('div', { className: 'empty-state-desc', text: 'Crea el primer grupo' })
    );

    grid.append(empty);
    return;
  }

  groups.forEach((group, index) => {
    const count = students.filter((s) => s.group_id === group.id).length;

    const card = el('div', { className: `group-card color-${index % 4}` });

    const header = el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
      },
    });

    const titleWrap = el('div');

    titleWrap.append(
      el('div', { className: 'group-name', text: group.name }),
      el('div', { className: 'group-meta', text: group.schedule || 'Sin horario' })
    );

    const buttons = el('div', { className: 'student-actions' });

    const editButton = el('button', { className: 'btn btn-secondary btn-sm', text: '✏️' });
    const deleteButton = el('button', { className: 'btn btn-danger btn-sm', text: '🗑' });

    editButton.addEventListener('click', () => onEdit(group.id));
    deleteButton.addEventListener('click', () => onDelete(group.id));

    buttons.append(editButton, deleteButton);

    header.append(titleWrap, buttons);

    card.append(
      header,
      el('div', { className: 'group-count', text: String(count) }),
      el('div', { className: 'group-meta', text: `${count} alumno${count === 1 ? '' : 's'}` })
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
