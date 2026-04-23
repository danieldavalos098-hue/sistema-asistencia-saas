import { recordAttendance, fetchTodayRecords } from './services/attendanceService.js';
import { ensureStudentDataLoaded, findStudentByCode, getGroup } from './services/studentService.js';
import { getConfiguredKioskPin, sendEntryMessage, sendExitMessage } from './services/whatsappService.js';
import { notifyError, showToast } from './ui.js';
import { formatTime, toDateString } from './utils.js';
import { renderTodayRecordsUI, setScanModeUI, showScanResult, showScannerState } from './ui/scannerUI.js';

let scanMode = 'ENTRADA';
let scanner = null;
let lastScan = '';
let lastScanTs = 0;
const DEBOUNCE_MS = 3000;

export function getScanMode() {
  return scanMode;
}

export function setScanMode(mode) {
  scanMode = mode;
  setScanModeUI(mode);
}

export async function startScanner() {
  showScannerState(true);

  if (!window.Html5Qrcode) {
    showToast('La libreria de escaneo no cargo.', 'error');
    showScannerState(false);
    return;
  }

  try {
    scanner = new window.Html5Qrcode('interactive');
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 100 } },
      (code) => processCode(code),
      () => {}
    );
  } catch (error) {
    notifyError(error, 'No se pudo acceder a la camara.');
    await stopScanner();
  }
}

export async function stopScanner() {
  if (scanner) {
    try {
      await scanner.stop();
    } catch (error) {
      notifyError(error, 'No se pudo detener el escáner.');
    }
    scanner = null;
  }
  showScannerState(false);
}

export async function processCode(code) {
  try {
    let value = (code || '').trim();
    if (!value) value = document.getElementById('manual-code')?.value.trim() || '';
    if (!value) return;

    if (value === lastScan && Date.now() - lastScanTs < DEBOUNCE_MS) return;
    lastScan = value;
    lastScanTs = Date.now();

    await ensureStudentDataLoaded({ students: true, groups: true });
    const student = findStudentByCode(value);
    if (!student) {
      showToast(`Código no encontrado: ${value}`, 'error');
      showScanResult(null, null, scanMode, value);
      return;
    }

    const now = new Date();
    await recordAttendance({
      studentId: student.id,
      type: scanMode,
      timestamp: now.toISOString(),
    });

    const group = getGroup(student.group_id);
    const date = toDateString(now);
    const time = formatTime(now.toISOString());

    showScanResult(student, group, scanMode, student.code, time);
    await renderTodayRecords();

    if (student.phone) {
      const notify = scanMode === 'ENTRADA' ? sendEntryMessage : sendExitMessage;
      notify(student.phone, student.name, time, date, group?.name || '').catch((error) => {
        showToast(error?.message || 'No se pudo enviar la notificación.', 'warning');
      });
    }
  } catch (error) {
    notifyError(error, 'No se pudo registrar la asistencia.');
  } finally {
    const input = document.getElementById('manual-code');
    if (input) input.value = '';
  }
}

export async function renderTodayRecords() {
  try {
    const records = await fetchTodayRecords(20);
    renderTodayRecordsUI(records);
    return records;
  } catch (error) {
    notifyError(error, 'No se pudieron cargar los registros del dia.');
    renderTodayRecordsUI([]);
    return [];
  }
}

export function enterKiosk() {
  document.body.classList.add('kiosk-mode');
  showToast('Modo Quiosco activado 🖥️');
}

export function exitKiosk() {
  const pin = prompt('Ingresa el PIN para salir del modo quiosco:');
  if (pin === getConfiguredKioskPin()) {
    document.body.classList.remove('kiosk-mode');
    showToast('Modo Quiosco desactivado');
  } else if (pin !== null) {
    showToast('PIN incorrecto', 'error');
  }
}
