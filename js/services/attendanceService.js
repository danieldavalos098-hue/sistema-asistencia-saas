import { getSupabase } from '../supabaseClient.js';
import { getCurrentUser } from '../auth.js';
import { toDateString } from '../utils.js';

function buildAttendanceError(message, error) {
  return new Error(error?.message || message);
}

// 🔥 Genera clave única por minuto (anti duplicado)
function generateMinuteKey(studentId, type, isoTimestamp) {
  return `${studentId}-${type}-${isoTimestamp.slice(0, 16)}`;
}

export async function recordAttendance({ studentId, type, timestamp }) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) throw new Error('Sin conexión o sin sesión.');

    const now = timestamp ? new Date(timestamp) : new Date();
    const iso = now.toISOString();

    const payload = {
      user_id: user.id,
      student_id: studentId,
      type,
      timestamp: iso,
      minute_key: generateMinuteKey(studentId, type, iso),
    };

    const { data, error } = await sb
      .from('attendance')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('⚠️ Ya registraste asistencia hace unos segundos');
      }

      throw buildAttendanceError('No se pudo registrar la asistencia.', error);
    }

    return data;
  } catch (error) {
    throw buildAttendanceError('No se pudo registrar la asistencia.', error);
  }
}

// 🔥 NUEVO: eliminar asistencia (soft delete)
export async function deleteAttendance(attendanceId) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) throw new Error('Sin conexión o sin sesión.');

    const { error } = await sb
      .from('attendance')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', attendanceId);

    if (error) {
      throw buildAttendanceError('No se pudo eliminar la asistencia.', error);
    }

    return true;
  } catch (error) {
    throw buildAttendanceError('No se pudo eliminar la asistencia.', error);
  }
}

export async function fetchTodayRecords(limit = 20) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) return [];

    const today = toDateString();

    const { data, error } = await sb
      .from('attendance')
      .select('*, students(name, lastname, group_id)')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw buildAttendanceError('No se pudieron cargar los registros del día.', error);
    }

    return data || [];
  } catch (error) {
    throw buildAttendanceError('No se pudieron cargar los registros del día.', error);
  }
}

export async function fetchAttendance({ from, to, groupId } = {}) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) return [];

    let query = sb
      .from('attendance')
      .select('*, students(id, name, lastname, group_id)')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .order('timestamp', { ascending: false });

    if (from) query = query.gte('timestamp', `${from}T00:00:00`);
    if (to) query = query.lte('timestamp', `${to}T23:59:59`);

    const { data, error } = await query;

    if (error) {
      throw buildAttendanceError('No se pudieron cargar los registros de asistencia.', error);
    }

    return groupId
      ? (data || []).filter((record) => record.students?.group_id === groupId)
      : (data || []);
  } catch (error) {
    throw buildAttendanceError('No se pudieron cargar los registros de asistencia.', error);
  }
}

export async function fetchRecentActivity({ type = '', limit = 100, todayOnly = false } = {}) {
  try {
    const sb = getSupabase();
    const user = await getCurrentUser();
    if (!sb || !user) return [];

    let query = sb
      .from('attendance')
      .select('*, students(name, lastname, group_id)')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('type', type);

    if (todayOnly) {
      const today = toDateString();
      query = query
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      throw buildAttendanceError('No se pudo cargar la actividad reciente.', error);
    }

    return data || [];
  } catch (error) {
    throw buildAttendanceError('No se pudo cargar la actividad reciente.', error);
  }
}
