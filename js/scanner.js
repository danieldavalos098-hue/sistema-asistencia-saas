// ============================================================
// scanner.js
// ============================================================

import { recordAttendance, fetchTodayRecords } from './services/attendanceService.js';
import { ensureStudentDataLoaded, findStudentByCode, getGroup } from './services/studentService.js';
import { getConfiguredKioskPin, sendEntryMessage, sendExitMessage } from './services/whatsappService.js';
import { notifyError, showToast } from './ui.js';
import { formatTime, toDateString } from './utils.js';
import { renderTodayRecordsUI, setScanModeUI, showScanResult, showScannerState } from './ui/scannerUI.js';

let scanMode   = 'ENTRADA';
let scanner    = null;
let lastScan   = '';
let lastScanTs = 0;
const DEBOUNCE_MS     = 1500;
const SCAN_COOLDOWN_MS = 16000;
const studentLastScan  = {};
let isProcessing = false;

export function getScanMode() { return scanMode; }

export function setScanMode(mode) {
  scanMode = mode;
  setScanModeUI(mode);
}

export async function startScanner() {
  showScannerState(true);

  if (!window.Html5Qrcode) {
    showToast('La librería de escaneo no cargó.', 'error');
    showScannerState(false);
    return;
  }

  try {
    scanner = new window.Html5Qrcode('interactive');
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 12, aspectRatio: 1.777 },
      code => processCode(code),
      () => {}
    );
  } catch (error) {
    notifyError(error, 'No se pudo acceder a la cámara.');
    await stopScanner();
  }
}

export async function stopScanner() {
  if (scanner) {
    try { await scanner.stop(); } catch (_) {}
    scanner = null;
  }
  showScannerState(false);
}

async function pauseScanner(ms = 1200) {
  if (!scanner) return;
  try {
    await scanner.pause(true);
    setTimeout(() => { try { scanner?.resume(); } catch (_) {} }, ms);
  } catch (_) {}
}

export async function processCode(code) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    let value = (code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!value) {
      value = document.getElementById('manual-code')?.value.trim().toUpperCase() || '';
    }
    if (!value) return;

    if (value === lastScan && Date.now() - lastScanTs < DEBOUNCE_MS) return;
    lastScan   = value;
    lastScanTs = Date.now();

    await ensureStudentDataLoaded({ students: true, groups: true });

    const student = findStudentByCode(value) || findStudentByCode(value.replace('-', ''));

    if (!student) {
      showToast(`Código no encontrado: ${value}`, 'error');
      showScanResult(null, null, scanMode, value);
      try { new Audio('/error.mp3').play(); } catch (_) {}
      return;
    }

    const nowTs = Date.now();
    if (studentLastScan[student.id] && (nowTs - studentLastScan[student.id] < SCAN_COOLDOWN_MS)) {
      showToast('⏳ Espera unos segundos antes de volver a registrar.', 'warning');
      return;
    }
    studentLastScan[student.id] = nowTs;

    const now = new Date();
    await recordAttendance({
      studentId: student.id,
      type:      scanMode,
      timestamp: now.toISOString(),
    });

    const group = getGroup(student.group_id);
    const date  = toDateString(now);
    const time  = formatTime(now.toISOString());

    showScanResult(student, group, scanMode, student.code, time);
    await renderTodayRecords();

    try { new Audio('/success.mp3').play(); } catch (_) {}
    await pauseScanner(1200);

    if (student.phone) {
      const notify = scanMode === 'ENTRADA' ? sendEntryMessage : sendExitMessage;
      notify(student.phone, student.name, time, date, group?.name || '')
        .catch(err => showToast(err?.message || 'No se pudo enviar la notificación.', 'warning'));
    }

  } catch (error) {
    notifyError(error, 'No se pudo registrar la asistencia.');
  } finally {
    const input = document.getElementById('manual-code');
    if (input) input.value = '';
    setTimeout(() => { isProcessing = false; }, 800);
  }
}

export async function renderTodayRecords() {
  try {
    const records = await fetchTodayRecords(50);
    renderTodayRecordsUI(records);
    return records;
  } catch (error) {
    notifyError(error, 'No se pudieron cargar los registros del día.');
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
