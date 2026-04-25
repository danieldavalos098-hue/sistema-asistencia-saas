// ============================================================
// carnetGenerator.js
// Genera un carné estudiantil completo y lo descarga como PNG
// Usar: await downloadCarnetPNG(student, group, institutionName)
// ============================================================

import { getResolvedBranding } from '../services/brandingService.js';

// ── Constantes de diseño ─────────────────────────────────────
const W = 638;   // ancho  (85.6 mm @ 188 DPI — tamaño tarjeta CR-80)
const H = 1008;  // alto   (proporción 1:1.575)
const R = 18;    // radio de esquinas

// Paleta (oscura, estilo SaaS)
const CLR = {
  bg:       '#0d1526',
  surface:  '#141e33',
  accent:   '#f5c800',
  accent2:  '#1a2a4a',
  text:     '#ffffff',
  muted:    '#7a8aaa',
  barBg:    '#ffffff',
  stripe:   '#f5c800',
};

// ── Fuentes ───────────────────────────────────────────────────
async function loadFonts() {
  if (document.fonts) {
    await document.fonts.load('bold 24px Montserrat');
    await document.fonts.load('600 16px Outfit');
  }
}

// ── Generar barcode como ImageBitmap via SVG temporal ─────────
function barcodeToDataURL(code) {
  return new Promise((resolve, reject) => {
    if (!window.JsBarcode) {
      reject(new Error('JsBarcode no está cargado'));
      return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    document.body.appendChild(svg);

    try {
      window.JsBarcode(svg, code, {
        format:       'CODE128',
        lineColor:    '#000000',
        background:   '#ffffff',
        width:        2.2,
        height:       72,
        displayValue: false,
        margin:       10,
      });

      const svgData   = new XMLSerializer().serializeToString(svg);
      const svgBlob   = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url       = URL.createObjectURL(svgBlob);
      const img       = new Image();

      img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error cargando barcode')); };
      img.src = url;

    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(svg);
    }
  });
}

// ── Dibujar esquinas redondeadas ──────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h,     x, y + h - r,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,         x + r, y,         r);
  ctx.closePath();
}

// ── Texto centrado con ellipsis ───────────────────────────────
function fillTextCenter(ctx, text, cx, y, maxW) {
  let t = text || '';
  while (ctx.measureText(t).width > maxW && t.length > 4) {
    t = t.slice(0, -2) + '…';
  }
  ctx.fillText(t, cx, y);
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────
export async function downloadCarnetPNG(student, group = null, institutionName = '') {
  if (!student) return;

  // Fuentes
  await loadFonts();

  // Nombre de la institución
  const branding  = getResolvedBranding();
  const instName  = institutionName || branding?.entityName || 'Institución Educativa';
  const fullName  = `${student.name || ''} ${student.lastname || ''}`.trim();
  const code      = student.code || student.id || '—';
  const groupName = group?.name || '';
  const groupShift = group?.schedule || group?.shift || '';

  // Canvas
  const canvas  = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext('2d');

  // ── 1. Fondo principal ────────────────────────────────────
  roundRect(ctx, 0, 0, W, H, R);
  ctx.fillStyle = CLR.bg;
  ctx.fill();
  ctx.save();
  ctx.clip();   // todo lo siguiente respeta las esquinas

  // ── 2. Franja superior (accent) ───────────────────────────
  ctx.fillStyle = CLR.accent;
  ctx.fillRect(0, 0, W, 14);

  // ── 3. Header: fondo secundario ───────────────────────────
  ctx.fillStyle = CLR.surface;
  ctx.fillRect(0, 14, W, 170);

  // ── 4. Logo / ícono ───────────────────────────────────────
  // Círculo con letra de la institución
  const logoX = W / 2;
  const logoY = 14 + 70;
  ctx.beginPath();
  ctx.arc(logoX, logoY, 44, 0, Math.PI * 2);
  ctx.fillStyle = CLR.bg;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(logoX, logoY, 44, 0, Math.PI * 2);
  ctx.strokeStyle = CLR.accent;
  ctx.lineWidth   = 3;
  ctx.stroke();

  ctx.fillStyle  = CLR.accent;
  ctx.font       = 'bold 42px Montserrat, Arial';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((instName[0] || 'I').toUpperCase(), logoX, logoY + 2);

  // ── 5. Nombre institución ─────────────────────────────────
  ctx.fillStyle    = CLR.text;
  ctx.font         = 'bold 18px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  fillTextCenter(ctx, instName.toUpperCase(), W / 2, 155, W - 60);

  // ── 6. Separador accent ───────────────────────────────────
  ctx.fillStyle = CLR.accent;
  ctx.fillRect(40, 184, W - 80, 2);

  // ── 7. Etiqueta CARNÉ ESTUDIANTIL ─────────────────────────
  ctx.fillStyle    = CLR.muted;
  ctx.font         = '600 13px Outfit, Arial';
  ctx.textAlign    = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('CARNÉ ESTUDIANTIL', W / 2, 218);
  ctx.letterSpacing = '0px';

  // ── 8. Avatar circular del alumno ─────────────────────────
  const avatarY = 260;
  const avatarR = 62;

  // Borde accent
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR + 3, 0, Math.PI * 2);
  ctx.fillStyle = CLR.accent;
  ctx.fill();

  // Fondo avatar
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = CLR.accent2;
  ctx.fill();

  // Iniciales
  const initials = [
    (student.name    || '')[0] || '',
    (student.lastname || '')[0] || '',
  ].join('').toUpperCase() || '?';

  ctx.fillStyle    = CLR.accent;
  ctx.font         = 'bold 46px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, W / 2, avatarY + 3);

  // ── 9. Nombre del alumno ──────────────────────────────────
  ctx.fillStyle    = CLR.text;
  ctx.font         = 'bold 30px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  fillTextCenter(ctx, fullName, W / 2, 370, W - 60);

  // ── 10. Grupo y turno ─────────────────────────────────────
  if (groupName) {
    ctx.fillStyle = CLR.accent;
    ctx.font      = '600 16px Outfit, Arial';
    const grpLabel = groupShift ? `${groupName} · ${groupShift}` : groupName;
    fillTextCenter(ctx, grpLabel, W / 2, 402, W - 80);
  }

  // ── 11. Chips de info ─────────────────────────────────────
  const chipY  = 436;
  const chipH  = 38;
  const chipW  = (W - 80 - 16) / 2;
  const chipX1 = 40;
  const chipX2 = 40 + chipW + 16;

  // Chip izquierdo: código
  roundRect(ctx, chipX1, chipY, chipW, chipH, 10);
  ctx.fillStyle = CLR.surface;
  ctx.fill();
  ctx.strokeStyle = CLR.accent2;
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.fillStyle    = CLR.muted;
  ctx.font         = '500 10px Outfit, Arial';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CÓDIGO', chipX1 + 12, chipY + 14);
  ctx.fillStyle = CLR.text;
  ctx.font      = '600 13px Outfit, Arial';
  ctx.fillText(code, chipX1 + 12, chipY + 30);

  // Chip derecho: año / fecha nacimiento
  roundRect(ctx, chipX2, chipY, chipW, chipH, 10);
  ctx.fillStyle = CLR.surface;
  ctx.fill();
  ctx.strokeStyle = CLR.accent2;
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.fillStyle    = CLR.muted;
  ctx.font         = '500 10px Outfit, Arial';
  ctx.fillText('AÑO LECTIVO', chipX2 + 12, chipY + 14);
  ctx.fillStyle = CLR.text;
  ctx.font      = '600 13px Outfit, Arial';
  ctx.fillText(new Date().getFullYear().toString(), chipX2 + 12, chipY + 30);

  // ── 12. Separador ─────────────────────────────────────────
  ctx.fillStyle = CLR.accent2;
  ctx.fillRect(40, chipY + chipH + 30, W - 80, 1);

  // ── 13. Código de barras ──────────────────────────────────
  const barcodeY   = chipY + chipH + 50;
  const barcodeH   = 130;   // alto del área blanca
  const barcodeW   = W - 80;
  const barcodePad = 14;

  // Fondo blanco del barcode
  roundRect(ctx, 40, barcodeY, barcodeW, barcodeH, 10);
  ctx.fillStyle = CLR.barBg;
  ctx.fill();

  try {
    const barcodeImg = await barcodeToDataURL(code);
    // Centrar el barcode dentro del rectángulo blanco
    const bw = Math.min(barcodeImg.naturalWidth || barcodeImg.width, barcodeW - barcodePad * 2);
    const bh = Math.min(barcodeImg.naturalHeight || barcodeImg.height, barcodeH - barcodePad * 2);
    const bx = 40 + (barcodeW - bw) / 2;
    const by = barcodeY + (barcodeH - bh) / 2;
    ctx.drawImage(barcodeImg, bx, by, bw, bh);
  } catch (_) {
    // Fallback: mostrar código en texto
    ctx.fillStyle    = '#000000';
    ctx.font         = 'bold 20px Outfit, Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, W / 2, barcodeY + barcodeH / 2);
  }

  // Código numérico debajo del barcode
  ctx.fillStyle    = CLR.muted;
  ctx.font         = '500 13px Outfit, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(code, W / 2, barcodeY + barcodeH + 26);

  // ── 14. Franja inferior accent ────────────────────────────
  const footerY = H - 70;
  ctx.fillStyle = CLR.surface;
  ctx.fillRect(0, footerY, W, 70);

  ctx.fillStyle = CLR.accent;
  ctx.fillRect(0, footerY, W, 3);

  // Texto inferior
  ctx.fillStyle    = CLR.muted;
  ctx.font         = '500 11px Outfit, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Este carné es intransferible · Válido solo con foto del titular', W / 2, footerY + 26);

  ctx.fillStyle = CLR.accent;
  ctx.font      = '600 12px Outfit, Arial';
  ctx.fillText(`© ${new Date().getFullYear()} ${instName}`, W / 2, footerY + 50);

  // ── 15. Franja inferior (borde) ───────────────────────────
  ctx.fillStyle = CLR.accent;
  ctx.fillRect(0, H - 10, W, 10);

  ctx.restore();   // fin del clip de esquinas

  // ── 16. Descargar ─────────────────────────────────────────
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `carne_${(fullName || code).replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}
