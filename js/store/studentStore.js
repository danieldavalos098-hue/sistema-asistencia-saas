const state = {
  students: [],
  groups: [],
  editingStudentId: null,
  editingGroupId: null,
};

export function setStudents(students) {
  state.students = students;
}

export function setGroups(groups) {
  state.groups = groups;
}

export function getStudentsState() {
  return state.students;
}

export function getGroupsState() {
  return state.groups;
}

export function getStudentById(id) {
  return state.students.find((student) => student.id === id) || null;
}

export function getStudentByCode(code) {
  return state.students.find((student) => student.code === code || student.id === code) || null;
}

export function getGroupById(id) {
  return state.groups.find((group) => group.id === id) || null;
}

export function upsertStudent(student) {
  const index = state.students.findIndex((item) => item.id === student.id);
  if (index === -1) state.students.push(student);
  else state.students[index] = student;
}

export function removeStudent(id) {
  state.students = state.students.filter((student) => student.id !== id);
}

export function upsertGroup(group) {
  const index = state.groups.findIndex((item) => item.id === group.id);
  if (index === -1) state.groups.push(group);
  else state.groups[index] = group;
}

export function removeGroup(id) {
  state.groups = state.groups.filter((group) => group.id !== id);
}

export function setEditingStudentId(id) {
  state.editingStudentId = id;
}

export function getEditingStudentId() {
  return state.editingStudentId;
}

export function setEditingGroupId(id) {
  state.editingGroupId = id;
}

export function getEditingGroupId() {
  return state.editingGroupId;
}
