# Sistema de Asistencia - Estudiantes

Sistema web modular para control de asistencia escolar con escaneo de codigos, reportes y notificaciones WhatsApp.

## Estructura del Proyecto

```text
refactored-attendance/
├── app.html
├── login.html
├── register.html
├── supabase_schema.sql
├── README.md
├── css/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   └── responsive.css
└── js/
    ├── app.js
    ├── auth.js
    ├── config.js
    ├── reports.js
    ├── scanner.js
    ├── students.js
    ├── supabaseClient.js
    ├── ui.js
    ├── utils.js
    ├── whatsapp.js
    ├── services/
    │   ├── attendanceService.js
    │   ├── brandingService.js
    │   ├── reportService.js
    │   ├── studentService.js
    │   └── whatsappService.js
    ├── store/
    │   ├── appStore.js
    │   ├── settingsStore.js
    │   └── studentStore.js
    └── ui/
        ├── brandingUI.js
        ├── dom.js
        ├── reportsUI.js
        ├── scannerUI.js
        └── studentsUI.js
```

## Configuracion

1. Ejecuta `supabase_schema.sql` en Supabase.
2. Abre `login.html`.
3. Configura `Project URL` y `Anon Key`.

## White Label

- Branding base centralizado en `js/config.js`.
- Branding dinamico por usuario en tabla `branding`.
- Si no existe branding personalizado, la aplicacion usa `APP_CONFIG`.

## Produccion

- Arquitectura separada por `services`, `store` y `ui`.
- Lazy loading por pagina.
- Manejo consistente de errores con notificaciones.
- Scanner desacoplado de DB, UI y WhatsApp.
