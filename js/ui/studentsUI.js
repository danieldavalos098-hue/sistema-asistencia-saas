// ============================================================
// ui/studentsUI.js
// ============================================================

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


// ── Tabla de Alumnos ─────────────────────────────────────────
export function renderStudentsTableUI({ onEdit, onDelete, onBarcode }, { filter = '', groupId = '' } = {}) {
  const tbody   = document.getElementById('students-tbody');
  const countEl = document.getElementById('students-count');
  if (!tbody) return;

  const query = filter.toLowerCase();

  const list = getStudentsState().filter(student => {
    const fullName    = `${student.name} ${student.lastname || ''}`.toLowerCase();
    const matchQuery  = !query || fullName.includes(query) || (student.code || '').toLowerCase().includes(query);
    const matchGroup  = !groupId || student.group_id === groupId;
    return matchQuery && matchGroup;
  });

  if (countEl) countEl.textContent = `${list.length} alumno${list.length === 1 ? '' : 's'}`;

  clearNode(tbody);

  if (!list.length) {
    const row  = el('tr');
    const cell = el('td', { attrs: { colspan: '5' } });
    const empty = el('div', { className: 'empty-state' });
    empty.append(
      el('div', { className: 'empty-state-icon', text: '🎓' }),
      el('div', { className: 'empty-state-title', text: 'Sin alumnos' }),
      el('div', { className: 'empty-state-desc', text: 'Agrega tu primer alumno con el botón +' }),
    );
    cell.append(empty);
    row.append(cell);
    tbody.append(row);
    return;
  }

  list.forEach(student => {
    const row    = el('tr');
    const group  = getGroupById(student.group_id);
    const avatar = avatarStyle(student.name);
    const fullName = `${student.name} ${student.lastname || ''}`.trim();

    // Celda alumno
    const studentCell = el('td');
    const wrap        = el('div', { className: 'student-cell' });
    const avatarNode  = el('div', {
      className: 'avatar',
      text: avatar.initials,
      style: { background: avatar.bg, color: avatar.color },
    });
    const info = el('div', { className: 'student-info' });
    info.append(
      el('div', { className: 'student-name', text: fullName }),
      el('div', { className: 'student-id',   text: student.code || '—' }),
    );
    wrap.append(avatarNode, info);
    studentCell.append(wrap);

    row.append(
      studentCell,
      el('td', { text: group?.name || '—' }),
      el('td', { text: student.phone || '—' }),
      el('td', { text: student.parent_name || '—' }),
    );

    // Acciones
    const actionCell = el('td');
    const actions    = el('div', { className: 'student-actions' });

    const btnBarcode = el('button', { className: 'btn btn-secondary btn-sm', text: '🪪' });
    const btnEdit    = el('button', { className: 'btn btn-secondary btn-sm', text: '✏️' });
    const btnDelete  = el('button', { className: 'btn btn-danger btn-sm',    text: '🗑' });

    btnBarcode.addEventListener('click', () => onBarcode(student.id));
    btnEdit.addEventListener('click',    () => onEdit(student.id));
    btnDelete.addEventListener('click',  () => onDelete(student.id));

    actions.append(btnBarcode, btnEdit, btnDelete);
    actionCell.append(actions);
    row.append(actionCell);
    tbody.append(row);
  });
}


// ── Grid de Grupos ───────────────────────────────────────────
export function renderGroupsGridUI({ onEdit, onDelete }) {
  const grid     = document.getElementById('groups-grid');
  if (!grid) return;
  clearNode(grid);

  const groups   = getGroupsState();
  const students = getStudentsState();

  if (!groups.length) {
    const empty = el('div', { className: 'empty-state', style: { gridColumn: '1/-1' } });
    empty.append(
      el('div', { className: 'empty-state-icon',  text: '🛡️' }),
      el('div', { className: 'empty-state-title', text: 'Sin grupos' }),
      el('div', { className: 'empty-state-desc',  text: 'Crea el primer grupo' }),
    );
    grid.append(empty);
    return;
  }

  groups.forEach((group, index) => {
    const count = students.filter(s => s.group_id === group.id).length;
    const card  = el('div', { className: `group-card color-${index % 4}` });

    const header    = el('div', { style: { display: 'flex', justifyContent: 'space-between' } });
    const titleWrap = el('div');
    titleWrap.append(
      el('div', { className: 'group-name', text: group.name }),
      el('div', { className: 'group-meta', text: group.schedule || group.shift || 'Sin horario' }),
    );

    const buttons   = el('div', { className: 'student-actions' });
    const btnEdit   = el('button', { className: 'btn btn-secondary btn-sm', text: '✏️' });
    const btnDelete = el('button', { className: 'btn btn-danger btn-sm',    text: '🗑' });
    btnEdit.addEventListener('click',   () => onEdit(group.id));
    btnDelete.addEventListener('click', () => onDelete(group.id));
    buttons.append(btnEdit, btnDelete);
    header.append(titleWrap, buttons);

    card.append(
      header,
      el('div', { className: 'group-count', text: String(count) }),
      el('div', { className: 'group-meta',  text: `${count} alumno${count === 1 ? '' : 's'}` }),
    );
    grid.append(card);
  });
}


// ── Selects de grupos ────────────────────────────────────────
export function populateGroupSelectsUI() {
  document.querySelectorAll('.group-select').forEach(select => {
    const current = select.value;
    clearNode(select);
    select.append(el('option', { attrs: { value: '' }, text: 'Sin grupo' }));
    getGroupsState().forEach(group => {
      select.append(el('option', { attrs: { value: group.id }, text: group.name }));
    });
    if (current) select.value = current;
  });

  // También el select de filtro de alumnos
  const filterSelect = document.getElementById('student-group-filter');
  if (filterSelect) {
    const current = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Todos los grupos</option>';
    getGroupsState().forEach(group => {
      const opt = document.createElement('option');
      opt.value = group.id;
      opt.textContent = group.name;
      filterSelect.appendChild(opt);
    });
    if (current) filterSelect.value = current;
  }
}


// ── Modal Alumno ─────────────────────────────────────────────
export function openStudentModalUI(studentId = null) {
  setEditingStudentId(studentId);

  const titleEl = document.getElementById('student-modal-title');
  if (titleEl) titleEl.textContent = studentId ? 'Editar Alumno' : 'Agregar Alumno';

  if (studentId) {
    const student = getStudentById(studentId);
    if (student) {
      setValue('st-name',     student.name       || '');
      setValue('st-lastname', student.lastname    || '');
      setValue('st-dob',      student.dob         || '');
      setValue('st-parent',   student.parent_name || '');
      setValue('st-phone',    student.phone       || '');
      // group_id necesita que el select ya esté poblado
      setTimeout(() => {
        const sel = document.getElementById('st-group');
        if (sel) sel.value = student.group_id || '';
      }, 0);
    }
  } else {
    clearValues(['st-name', 'st-lastname', 'st-dob', 'st-parent', 'st-phone']);
    const sel = document.getElementById('st-group');
    if (sel) sel.value = '';
  }

  openModal('modal-student');
}

export function closeStudentModalUI() {
  closeModal('modal-student');
  setEditingStudentId(null);
}

export function getStudentModalPayload() {
  return {
    id: getEditingStudentId(),
    payload: {
      name:        getValue('st-name'),
      lastname:    getValue('st-lastname'),
      dob:         getValue('st-dob')    || null,
      parent_name: getValue('st-parent'),
      phone:       getValue('st-phone'),
      group_id:    getValue('st-group')  || null,
    },
  };
}


// ── Modal Grupo ──────────────────────────────────────────────
export function openGroupModalUI(groupId = null) {
  setEditingGroupId(groupId);

  const titleEl = document.getElementById('group-modal-title');
  if (titleEl) titleEl.textContent = groupId ? 'Editar Grupo' : 'Nuevo Grupo';

  if (groupId) {
    const group = getGroupById(groupId);
    if (group) {
      setValue('grp-name',    group.name    || '');
      setValue('grp-teacher', group.teacher || '');
      const shiftSel = document.getElementById('grp-shift');
      if (shiftSel) shiftSel.value = group.schedule || group.shift || 'Mañana';
    }
  } else {
    clearValues(['grp-name', 'grp-teacher']);
    const shiftSel = document.getElementById('grp-shift');
    if (shiftSel) shiftSel.value = 'Mañana';
  }

  openModal('modal-group');
}

export function closeGroupModalUI() {
  closeModal('modal-group');
  setEditingGroupId(null);
}

export function getGroupModalPayload() {
  return {
    id: getEditingGroupId(),
    payload: {
      name:     getValue('grp-name'),
      schedule: document.getElementById('grp-shift')?.value || 'Mañana',
      teacher:  getValue('grp-teacher'),
    },
  };
}


// ── Modal Carné / Barcode ─────────────────────────────────────
export function openBarcodeModalUI(student) {
  const nameEl     = document.getElementById('barcode-student-name');
  const idEl       = document.getElementById('barcode-id-text');
  const canvasWrap = document.getElementById('barcode-canvas');

  if (nameEl) nameEl.textContent = `${student.name} ${student.lastname || ''}`.trim();
  if (idEl)   idEl.textContent   = student.code || student.id;

  if (canvasWrap) {
    canvasWrap.innerHTML = '<svg id="barcode-svg"></svg>';
    const code = student.code || student.id;

    if (window.JsBarcode && code) {
      try {
        window.JsBarcode('#barcode-svg', code, {
          format:       'CODE128',
          lineColor:    '#000',
          background:   '#fff',
          width:        2,
          height:       80,
          displayValue: true,
          fontSize:     14,
        });
      } catch (_) {
        canvasWrap.innerHTML = `<p style="color:#ef4444;text-align:center">Error generando código</p>`;
      }
    } else {
      canvasWrap.innerHTML = `<p style="color:#64748b;text-align:center;font-size:13px">${code}</p>`;
    }
  }

  openModal('modal-barcode');
}
