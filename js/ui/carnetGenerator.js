// ============================================================
// carnetGenerator.js
// Carné estudiantil estilo documento oficial / credencial real
// Orientación horizontal (DNI) · CR-80 @ 2× resolución
// ============================================================

import { getResolvedBranding } from '../services/brandingService.js';

// ── Dimensiones CR-80 horizontal a 2× (impresión nítida) ─────
const W = 856;   // 85.6 mm × 10 px/mm × 2
const H = 540;   // 54.0 mm × 10 px/mm × 2
const R = 20;    // radio esquinas

// ── Paleta institucional profesional ─────────────────────────
const C = {
  headerBg:    '#0b1f3a',   // azul marino (header / footer)
  bodyBg:      '#f4f6f9',   // gris muy claro (cuerpo)
  white:       '#ffffff',
  accent:      '#1a56a0',   // azul institucional
  accentDark:  '#0b3d7a',
  accentLight: '#dce8f8',
  text:        '#0d1f35',   // casi negro
  textMid:     '#3a4a5e',
  textLight:   '#7a8fa8',
  label:       '#8a9db5',
  border:      '#c8d6e5',
  stripe:      '#e8b400',   // dorado (franja decorativa)
  photoBg:     '#c8d6e5',
  photoText:   '#0b3d7a',
};

// ── Helpers ───────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,       x + w, y + r,       r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h,   x + w - r, y + h,   r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h,       x, y + h - r,       r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,           x + r, y,           r);
  ctx.closePath();
  if (fill)   { ctx.fillStyle   = fill;   ctx.fill();   }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function setShadow(ctx, blur, color, oy = 3) {
  ctx.shadowBlur    = blur;
  ctx.shadowColor   = color;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = oy;
}

function clearShadow(ctx) {
  ctx.shadowBlur    = 0;
  ctx.shadowColor   = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function clip(ctx, text, maxW) {
  let t = String(text || '');
  while (t.length > 3 && ctx.measureText(t).width > maxW) t = t.slice(0, -2) + '…';
  return t;
}

// ── Barcode como imagen ───────────────────────────────────────
function buildBarcodeImg(code) {
  return new Promise(resolve => {
    if (!window.JsBarcode || !code) { resolve(null); return; }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    document.body.appendChild(svg);
    try {
      window.JsBarcode(svg, code, {
        format: 'CODE128', lineColor: '#000', background: '#fff',
        width: 1.8, height: 50, displayValue: false, margin: 6,
      });
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch (_) { resolve(null); }
    finally { document.body.removeChild(svg); }
  });
}

async function waitFonts() {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load('700 18px Montserrat'),
    document.fonts.load('400 11px Montserrat'),
    document.fonts.load('600 13px Inter'),
    document.fonts.load('400 10px Inter'),
  ]);
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────
export async function downloadCarnetPNG(student, group = null) {
  if (!student) return;
  await waitFonts();

  const branding  = getResolvedBranding();
  const instName  = branding?.entityName || 'Institución Educativa';
  const shortName = branding?.shortName  ||
    instName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 4).toUpperCase();

  const fullName  = `${student.name || ''} ${student.lastname || ''}`.trim();
  const code      = student.code || student.id || '—';
  const groupName = group?.name     || '—';
  const shift     = group?.schedule || group?.shift || '—';
  const year      = new Date().getFullYear().toString();
  const initials  = [
    (student.name     || '')[0] || '',
    (student.lastname || '')[0] || '',
  ].join('').toUpperCase() || '?';

  const canvas  = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext('2d');

  const barcodeImg = await buildBarcodeImg(code);

  // ── CLIP de esquinas ─────────────────────────────────────────
  ctx.save();
  roundRect(ctx, 0, 0, W, H, R, C.white);
  ctx.clip();

  // ── Cuerpo base ───────────────────────────────────────────────
  ctx.fillStyle = C.bodyBg;
  ctx.fillRect(0, 0, W, H);

  // ── HEADER ───────────────────────────────────────────────────
  const HH = 100; // header height
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(0, 0, W, HH);

  // Patrón de micro-puntos en header (marca de seguridad sutil)
  ctx.save();
  ctx.globalAlpha = 0.055;
  for (let xi = 0; xi <= W; xi += 16)
    for (let yi = 0; yi <= HH; yi += 16) {
      ctx.beginPath();
      ctx.arc(xi, yi, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Franja dorada (bajo el header)
  ctx.fillStyle = C.stripe;
  ctx.fillRect(0, HH, W, 5);

  // ── Logo circular en header ───────────────────────────────────
  const LCX = 50, LCY = HH / 2, LR = 28;

  // Anillo dorado
  ctx.beginPath();
  ctx.arc(LCX, LCY, LR, 0, Math.PI * 2);
  ctx.fillStyle = C.stripe;
  ctx.fill();

  // Interior azul oscuro
  ctx.beginPath();
  ctx.arc(LCX, LCY, LR - 4, 0, Math.PI * 2);
  ctx.fillStyle = C.headerBg;
  ctx.fill();

  // Letra inicial
  ctx.fillStyle    = C.stripe;
  ctx.font         = 'bold 26px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((instName[0] || 'I').toUpperCase(), LCX, LCY + 1);

  // Separador vertical
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(LCX + LR + 14, 16);
  ctx.lineTo(LCX + LR + 14, HH - 16);
  ctx.stroke();

  // Nombre institución + subtítulo
  const TXT_X = LCX + LR + 26;
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 14px Montserrat, Arial';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(clip(ctx, instName.toUpperCase(), W - TXT_X - 120), TXT_X, LCY - 8);

  ctx.fillStyle = C.stripe;
  ctx.font      = '600 10px Inter, Arial';
  ctx.fillText('SISTEMA DE GESTIÓN EDUCATIVA', TXT_X, LCY + 12);

  // Año / lado derecho header
  ctx.fillStyle    = 'rgba(255,255,255,0.4)';
  ctx.font         = '400 10px Inter, Arial';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(year, W - 24, LCY);

  // ── FOTO del alumno ───────────────────────────────────────────
  const PX = 32, PY = HH + 20, PW = 116, PH = 148, PR = 10;

  ctx.save();
  setShadow(ctx, 14, 'rgba(26,86,160,0.16)');
  roundRect(ctx, PX, PY, PW, PH, PR, C.photoBg);
  clearShadow(ctx);
  ctx.restore();

  // Borde
  ctx.save();
  ctx.lineWidth = 2.5;
  roundRect(ctx, PX, PY, PW, PH, PR, null, C.accent);
  ctx.restore();

  // Iniciales
  ctx.fillStyle    = C.photoText;
  ctx.font         = 'bold 40px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, PX + PW / 2, PY + PH / 2 - 8);

  ctx.fillStyle = C.accent;
  ctx.font      = '700 9px Inter, Arial';
  ctx.fillText('FOTO', PX + PW / 2, PY + PH / 2 + 28);

  // Chip ESTUDIANTE bajo foto
  const CY = PY + PH + 10, CW = PW, CH = 24;
  roundRect(ctx, PX, CY, CW, CH, 6, C.accent);
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 9px Montserrat, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ESTUDIANTE', PX + CW / 2, CY + CH / 2);

  // ── DATOS del alumno ──────────────────────────────────────────
  const DX = PX + PW + 26;
  const DY = HH + 20;
  const DW = W - DX - 24;

  // Nombre en hasta 2 líneas
  ctx.fillStyle    = C.text;
  ctx.font         = 'bold 20px Montserrat, Arial';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  const parts = fullName.split(' ');
  const mid   = Math.ceil(parts.length / 2);
  const nl1   = parts.slice(0, mid).join(' ');
  const nl2   = parts.slice(mid).join(' ');
  ctx.fillText(clip(ctx, nl1, DW), DX, DY + 24);
  if (nl2) ctx.fillText(clip(ctx, nl2, DW), DX, DY + 48);

  // Divisor
  ctx.strokeStyle = C.accentLight;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(DX, DY + 60);
  ctx.lineTo(DX + DW, DY + 60);
  ctx.stroke();

  // Grid de datos 2 × 2
  const fields = [
    { label: 'CÓDIGO / ID',   value: code       },
    { label: 'GRUPO / GRADO', value: groupName  },
    { label: 'TURNO',         value: shift      },
    { label: 'AÑO LECTIVO',   value: year       },
  ];

  const COL  = DW / 2;
  const RH   = 50;
  const GY   = DY + 74;

  fields.forEach((f, i) => {
    const fx = DX + (i % 2) * COL;
    const fy = GY + Math.floor(i / 2) * RH;

    ctx.fillStyle    = C.label;
    ctx.font         = '600 8px Inter, Arial';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(f.label, fx, fy);

    ctx.fillStyle = C.text;
    ctx.font      = 'bold 13px Inter, Arial';
    ctx.fillText(clip(ctx, f.value, COL - 14), fx, fy + 17);

    ctx.strokeStyle = C.border;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 25);
    ctx.lineTo(fx + COL - 12, fy + 25);
    ctx.stroke();
  });

  // ── CÓDIGO DE BARRAS ──────────────────────────────────────────
  const BY = CY + CH + 16;   // justo bajo el chip de estudiante
  const BX = 24, BW = W - 48, BH = 82;

  ctx.save();
  setShadow(ctx, 6, 'rgba(0,0,0,0.07)');
  roundRect(ctx, BX, BY, BW, BH, 8, C.white);
  clearShadow(ctx);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 1;
  roundRect(ctx, BX, BY, BW, BH, 8, null, C.border);
  ctx.restore();

  if (barcodeImg) {
    const bw = Math.min(barcodeImg.naturalWidth  || barcodeImg.width,  BW - 20);
    const bh = Math.min(barcodeImg.naturalHeight || barcodeImg.height, BH - 16);
    ctx.drawImage(barcodeImg, BX + (BW - bw) / 2, BY + (BH - bh) / 2, bw, bh);
  } else {
    ctx.fillStyle    = C.textMid;
    ctx.font         = 'bold 13px Inter, Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, BX + BW / 2, BY + BH / 2);
  }

  // Código textual bajo el barcode
  ctx.fillStyle    = C.textLight;
  ctx.font         = '500 9px Inter, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '2px';
  ctx.fillText(code, BX + BW / 2, BY + BH + 13);
  ctx.letterSpacing = '0px';

  // ── FOOTER ────────────────────────────────────────────────────
  const FY = H - 30;
  ctx.fillStyle = C.headerBg;
  ctx.fillRect(0, FY, W, 30);
  ctx.fillStyle = C.stripe;
  ctx.fillRect(0, FY, W, 2);

  ctx.fillStyle    = 'rgba(255,255,255,0.45)';
  ctx.font         = '400 8px Inter, Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Este carné es intransferible y de uso exclusivo del titular · ${instName} © ${year}`,
    W / 2, FY + 16
  );

  // ID serie esquina
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font      = '400 7px Inter, Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`REF: ${code}`, W - 12, FY + 24);

  // ── Watermark diagonal (seguridad) ────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.fillStyle   = C.accent;
  ctx.font        = '600 11px Inter, Arial';
  ctx.textAlign   = 'left';
  for (let xi = -80; xi < W + 80; xi += 130)
    for (let yi = HH + 10; yi < FY; yi += 34) {
      ctx.save();
      ctx.translate(xi, yi);
      ctx.rotate(-Math.PI / 8);
      ctx.fillText(shortName, 0, 0);
      ctx.restore();
    }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Borde exterior ────────────────────────────────────────────
  ctx.restore(); // fin del clip de esquinas

  ctx.save();
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0, 0, W, H, R, null, C.border);
  ctx.restore();

  // ── DESCARGA PNG ──────────────────────────────────────────────
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `carne_${(fullName || code).replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}
