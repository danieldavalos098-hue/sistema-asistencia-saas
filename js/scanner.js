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
const DEBOUNCE_MS = 1500; // más rápido

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
      {
        fps: 12,
        aspectRatio: 1.777 // pantalla completa (sin cuadro)
      },
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
    let value = (code || '').trim().toUpperCase();

    // limpiar espacios invisibles o saltos
    value = value.replace(/\s+/g, '');

    // fallback manual
    if (!value) {
      value = document.getElementById('manual-code')?.value.trim().toUpperCase() || '';
    }

    if (!value) return;

    console.log("SCAN:", value);

    // debounce (evita doble escaneo rápido)
    if (value === lastScan && Date.now() - lastScanTs < DEBOUNCE_MS) return;
    lastScan = value;
    lastScanTs = Date.now();

    await ensureStudentDataLoaded({ students: true, groups: true });

    // búsqueda flexible (por si el QR viene raro)
    let student = findStudentByCode(value);

    if (!student) {
      student = findStudentByCode(value.replace('-', ''));
    }

    if (!student) {
      showToast(`Código no encontrado: ${value}`, 'error');
      showScanResult(null, null, scanMode, value);

      // sonido error (opcional)
      try {
        new Audio('/error.mp3').play();
      } catch {}

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

    // sonido éxito (opcional)
    try {
      new Audio('/success.mp3').play();
    } catch {}

    // WhatsApp automático
    if (student.phone) {
      const notify = scanMode === 'ENTRADA' ? sendEntryMessage : sendExitMessage;

      notify(student.phone, student.name, time, date, group?.name || '')
        .catch((error) => {
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
