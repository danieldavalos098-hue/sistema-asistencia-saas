import { APP_CONFIG } from './config.js';

export function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatTime(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleTimeString(APP_CONFIG.locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateValue) {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleString(APP_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
}

export function avatarStyle(name = '') {
  const palette = [
    { bg: '#f5c800', color: '#1a1a00' },
    { bg: '#1a6fbb', color: '#ffffff' },
    { bg: '#f59e0b', color: '#1a1000' },
    { bg: '#ef4444', color: '#ffffff' },
    { bg: '#8b5cf6', color: '#ffffff' },
    { bg: '#10b981', color: '#ffffff' },
  ];
  const index = (name.charCodeAt(0) || 0) % palette.length;
  return { ...palette[index], initials: initials(name) };
}

export function normalizePhone(phone = '') {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `51${digits}`;
  return digits;
}

export function generateCode(prefix = 'STU') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function percentColor(pct) {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 60) return 'var(--accent3)';
  return 'var(--danger)';
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '';
}

export function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

export function getValue(id) {
  return (document.getElementById(id)?.value ?? '').trim();
}

export function clearValues(ids) {
  ids.forEach((id) => setValue(id, ''));
}

export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
