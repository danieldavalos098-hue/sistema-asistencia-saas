import { recordAttendance, fetchTodayRecords } from './services/attendanceService.js';
import { ensureStudentDataLoaded, findStudentByCode, getGroup } from './services/studentService.js';
import { getConfiguredKioskPin, sendEntryMessage, sendExitMessage } from './services/whatsappService.js';
import { notifyError, showToast } from './ui.js';
import { formatTime, toDateString } from './utils.js';
import { renderTodayRecordsUI, setScanModeUI, showScanResult, showScannerState } from './ui/scannerUI.js';

let scanMode = 'ENTRADA';
let scanner = null;

// 🔥 control anti doble scan
let lastScan = '';
let lastScanTs = 0;
const DEBOUNCE_MS = 1500;

// 🔥 control por alumno (clave)
const SCAN_COOLDOWN_MS = 16000; // 16 segundos
const studentLastScan = {};

// 🔥 control de proceso
let isProcessing = false;

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
        aspectRatio: 1.777 // pantalla completa
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

// 🔥 pausa temporal del scanner
async function pauseScanner(ms = 1200) {
  if (!scanner) return;
  try {
    await scanner.pause(true);
    setTimeout(() => {
      scanner.resume();
    }, ms);
  } catch {}
}

export async function processCode(code) {
  // 🔥 evitar múltiples ejecuciones simultáneas
  if (isProcessing) return;
  isProcessing = true;

  try {
    let value = (code || '').trim().toUpperCase();
    value = value.replace(/\s+/g, '');

    if (!value) {
      value = document.getElementById('manual-code')?.value.trim().toUpperCase() || '';
    }

    if (!value) return;

    console.log("SCAN:", value);

    // 🔥 debounce general
    if (value === lastScan && Date.now() - lastScanTs < DEBOUNCE_MS) return;
    lastScan = value;
    lastScanTs = Date.now();

    await ensureStudentDataLoaded({ students: true, groups: true });

    let student = findStudentByCode(value) || findStudentByCode(value.replace('-', ''));

    if (!student) {
      showToast(`Código no encontrado: ${value}`, 'error');
      showScanResult(null, null, scanMode, value);

      try { new Audio('/error.mp3').play(); } catch {}

      return;
    }

    const now = new Date();
    const nowTs = Date.now();

    // 🔥 BLOQUEO POR ALUMNO (ANTI DOBLE REAL)
    if (studentLastScan[student.id] && (nowTs - studentLastScan[student.id] < SCAN_COOLDOWN_MS)) {
      showToast("⏳ Espera unos segundos...", "warning");
      return;
    }

    studentLastScan[student.id] = nowTs;

    // 🔥 registrar asistencia
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

    // 🔥 sonido éxito
    try { new Audio('/success.mp3').play(); } catch {}

    // 🔥 pausa scanner para evitar doble lectura
    await pauseScanner(1200);

    // 🔥 WhatsApp
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

    // liberar proceso
    setTimeout(() => {
      isProcessing = false;
    }, 800);
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
