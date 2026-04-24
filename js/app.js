// 🔥 APP ESTABLE FINAL (SIN ERRORES)

window.addEventListener('DOMContentLoaded', () => {

  console.log('APP OK ✅');

  const navItems = document.querySelectorAll('.nav-item, .bottom-nav-item');
  const pages = document.querySelectorAll('.page');
  const title = document.getElementById('page-title');

  // 🔹 navegación
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (!page) return;

      // activar menú
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // ocultar páginas
      pages.forEach(p => p.classList.remove('active'));

      // mostrar página
      const target = document.getElementById(`page-${page}`);
      if (target) target.classList.add('active');

      // cambiar título
      if (title) title.textContent = item.textContent.trim();

      console.log('Ir a:', page);
    });
  });

  // 🔹 botón descargar carnet
  const btnDownload = document.getElementById('btn-download-barcode');

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const canvas = document.getElementById('barcode-cv');
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = 'carnet.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  // 🔹 cerrar modales
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close');
      const modal = document.getElementById(id);
      if (modal) modal.style.display = 'none';
    });
  });

});
