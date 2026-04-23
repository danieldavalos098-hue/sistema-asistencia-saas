import { getSupabase } from '../supabaseClient.js';
import { getCurrentUser } from '../auth.js';
import {
  getGroupById,
  getGroupsState,
  getStudentByCode,
  getStudentById,
  getStudentsState,
  removeGroup,
  removeStudent,
  setGroups,
  setStudents,
  upsertGroup,
  upsertStudent,
} from '../store/studentStore.js';
import { generateCode } from '../utils.js';

let studentsLoaded = false;
let groupsLoaded = false;

function buildStudentServiceError(message, error) {
  return new Error(error?.message || message);
}

export async function loadStudents() {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) {
      setStudents([]);
      studentsLoaded = false;
      return [];
    }

    const { data, error } = await sb
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw buildStudentServiceError('No se pudieron cargar los alumnos.', error);
    setStudents(data || []);
    studentsLoaded = true;
    return getStudentsState();
  } catch (error) {
    studentsLoaded = false;
    throw buildStudentServiceError('No se pudieron cargar los alumnos.', error);
  }
}

export async function loadGroups() {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) {
      setGroups([]);
      groupsLoaded = false;
      return [];
    }

    const { data, error } = await sb
      .from('groups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw buildStudentServiceError('No se pudieron cargar los grupos.', error);
    setGroups(data || []);
    groupsLoaded = true;
    return getGroupsState();
  } catch (error) {
    groupsLoaded = false;
    throw buildStudentServiceError('No se pudieron cargar los grupos.', error);
  }
}

export async function loadStudentCoreData() {
  try {
    await Promise.all([loadStudents(), loadGroups()]);
    return {
      students: getStudentsState(),
      groups: getGroupsState(),
    };
  } catch (error) {
    throw buildStudentServiceError('No se pudieron cargar los datos de alumnos.', error);
  }
}

export async function ensureStudentDataLoaded({ students = true, groups = true, force = false } = {}) {
  try {
    const tasks = [];
    if (students && (!studentsLoaded || force)) tasks.push(loadStudents());
    if (groups && (!groupsLoaded || force)) tasks.push(loadGroups());
    if (tasks.length) await Promise.all(tasks);

    return {
      students: getStudentsState(),
      groups: getGroupsState(),
    };
  } catch (error) {
    throw buildStudentServiceError('No se pudieron preparar los datos de alumnos.', error);
  }
}

export async function createStudent(payload) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) throw new Error('Sin conexión o sin sesión.');

    const { data, error } = await sb
      .from('students')
      .insert({
        ...payload,
        user_id: user.id,
        code: payload.code || generateCode(),
      })
      .select()
      .single();

    if (error) throw buildStudentServiceError('No se pudo crear el alumno.', error);
    upsertStudent(data);
    studentsLoaded = true;
    return data;
  } catch (error) {
    throw buildStudentServiceError('No se pudo crear el alumno.', error);
  }
}

export async function updateStudent(id, payload) {
  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Sin conexión.');

    const { data, error } = await sb
      .from('students')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw buildStudentServiceError('No se pudo actualizar el alumno.', error);
    upsertStudent(data);
    return data;
  } catch (error) {
    throw buildStudentServiceError('No se pudo actualizar el alumno.', error);
  }
}

export async function deleteStudent(id) {
  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Sin conexión.');

    const { error } = await sb.from('students').delete().eq('id', id);
    if (error) throw buildStudentServiceError('No se pudo eliminar el alumno.', error);
    removeStudent(id);
  } catch (error) {
    throw buildStudentServiceError('No se pudo eliminar el alumno.', error);
  }
}

export async function createGroup(payload) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) throw new Error('Sin conexión o sin sesión.');

    const { data, error } = await sb
      .from('groups')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) throw buildStudentServiceError('No se pudo crear el grupo.', error);
    upsertGroup(data);
    groupsLoaded = true;
    return data;
  } catch (error) {
    throw buildStudentServiceError('No se pudo crear el grupo.', error);
  }
}

export async function updateGroup(id, payload) {
  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Sin conexión.');

    const { data, error } = await sb
      .from('groups')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw buildStudentServiceError('No se pudo actualizar el grupo.', error);
    upsertGroup(data);
    return data;
  } catch (error) {
    throw buildStudentServiceError('No se pudo actualizar el grupo.', error);
  }
}

export async function deleteGroup(id) {
  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Sin conexión.');

    const { error } = await sb.from('groups').delete().eq('id', id);
    if (error) throw buildStudentServiceError('No se pudo eliminar el grupo.', error);
    removeGroup(id);
  } catch (error) {
    throw buildStudentServiceError('No se pudo eliminar el grupo.', error);
  }
}

export function getStudents() {
  return getStudentsState();
}

export function getGroups() {
  return getGroupsState();
}

export function getStudent(id) {
  return getStudentById(id);
}

export function findStudentByCode(code) {
  return getStudentByCode(code);
}

export function getGroup(id) {
  return getGroupById(id);
}
