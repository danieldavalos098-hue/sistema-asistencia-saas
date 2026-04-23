import { APP_CONFIG } from '../config.js';

export function applyBrandingToDocument(branding) {
  const current = branding || APP_CONFIG;

  document.title = current.appName;

  const titleMeta = document.querySelector('meta[name="application-name"]');
  if (titleMeta) titleMeta.setAttribute('content', current.appName);

  document.querySelectorAll('[data-brand-app-name]').forEach((node) => {
    node.textContent = current.appName;
  });

  document.querySelectorAll('[data-brand-short-name]').forEach((node) => {
    node.textContent = current.shortName;
  });

  document.querySelectorAll('[data-brand-entity-name]').forEach((node) => {
    node.textContent = current.entityName;
  });

  document.querySelectorAll('[data-brand-card-title]').forEach((node) => {
    node.textContent = current.cardTitle;
  });

  document.querySelectorAll('[data-brand-footer-text]').forEach((node) => {
    node.textContent = current.footerText;
  });

  document.querySelectorAll('[data-brand-page-title]').forEach((node) => {
    node.textContent = current.shortName;
  });
}
