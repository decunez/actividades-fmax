document.addEventListener('DOMContentLoaded', () => {
  // Control del menú móvil
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Carga nombre en navbar
  cargarNombreUsuario();

  // Si estamos en la página de usuarios, carga la lista
  if (document.getElementById('tabla-usuarios')) {
    cargarTablaUsuarios();
  }
});

async function cargarNombreUsuario() {
  const elementoNombre = document.getElementById('nombre-usuario');
  if (!elementoNombre) return;

  const API_URL = 'https://actividades-fmax.vercel.app/api/usuario';

  try {
    const respuesta = await fetch(API_URL);
    const datos = await respuesta.json();
    if (datos && datos.nombre) {
      elementoNombre.textContent = datos.nombre;
    }
  } catch (error) {
    console.error('Error al obtener usuario ID 1:', error);
  }
}

async function cargarTablaUsuarios() {
  const tabla = document.getElementById('tabla-usuarios');
  const API_URL = 'https://actividades-fmax.vercel.app/api/usuarios';

  try {
    const respuesta = await fetch(API_URL);
    const usuarios = await respuesta.json();

    tabla.innerHTML = ''; // Limpia contenido anterior

    usuarios.forEach(u => {
      const fila = document.createElement('tr');
      
      // Estilo visual del badge de sector
      const sectorBadgeClass = (u.sector || '').toLowerCase() === 'norte' ? 'badge-media' : 'badge-alta';

      fila.innerHTML = `
        <td>${u.id}</td>
        <td><strong>${u.nombre}</strong></td>
        <td>${u.telefono || '-'}</td>
        <td>${u.direccion || '-'}</td>
        <td><span class="badge ${sectorBadgeClass}">${u.sector || 'N/A'}</span></td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error('Error al cargar lista de usuarios:', error);
    tabla.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Error al cargar datos de la BD</td></tr>`;
  }
}