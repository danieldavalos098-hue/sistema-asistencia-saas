export const APP_CONFIG = {
  appName: 'Sistema de Asistencia - Estudiantes',
  shortName: 'Sistema de Asistencia',
  entityName: 'Institución Educativa',
  cardTitle: 'Carné Estudiantil',
  footerText: '© 2026 Sistema de Asistencia',
  kioskPin: '1234',
  locale: 'es-PE',
};

export const DEFAULT_MESSAGE_TEMPLATES = {
  entry: 'Hola. *{{nombre}}* registro ENTRADA en {{entityName}} a las *{{hora}}*. Fecha: {{fecha}}.',
  exit: 'Hola. *{{nombre}}* registro SALIDA en {{entityName}} a las *{{hora}}*. Fecha: {{fecha}}.',
  absent: 'Hola. *{{nombre}}* no registro asistencia hoy en {{entityName}}. Fecha: {{fecha}}.',
};
