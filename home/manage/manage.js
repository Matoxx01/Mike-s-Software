import { uploadUser, searchUserByRut } from '../../database/firebase.js';

// Inicialización cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {

  // Obtén el nombre del localStorage
  const empleado = JSON.parse(localStorage.getItem('empleado'));

  // --- Eventos de la Toolbar ---

  // Botones de navegación (la estructura asume que el primer, segundo y tercer botón en .toolbar-left son: atras, adelante y recargar)
  const backBtn = document.querySelector('.toolbar-left button:nth-child(1)');
  const forwardBtn = document.querySelector('.toolbar-left button:nth-child(2)');
  const refreshBtn = document.querySelector('.toolbar-left button:nth-child(3)');
  const moreOptionsBtn = document.querySelector('.toolbar-right button');
  const moreOptionsMenu = document.getElementById('moreOptionsMenu');

  backBtn.addEventListener('click', () => {
    window.history.back();
  });

  forwardBtn.addEventListener('click', () => {
    window.history.forward();
  });

  refreshBtn.addEventListener('click', () => {
    window.location.reload();
  });

  // Si el usuario no es admin, ocultamos la opción de "Gestion de empleados"
  if (!empleado || !empleado.admin) {
    const manageEmployeesItem = document.getElementById('manageEmployees');
    manageEmployeesItem.style.display = "none";
  }

  // Al hacer click en el botón se alterna la visibilidad del menú
  moreOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que el clic se propague y cierre el menú de inmediato
    moreOptionsMenu.classList.toggle('show');
  });

  // Cerrar el menú al hacer clic en cualquier parte fuera del menú
  document.addEventListener('click', (e) => {
    if (moreOptionsMenu.classList.contains('show')) {
      moreOptionsMenu.classList.remove('show');
    }
  });

  // --- Búsqueda de usuario por RUT en la barra de búsqueda ---
  const searchInput = document.querySelector('.toolbar-center input');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rut = searchInput.value.trim();
      if (!rut) {
        showFlashMessage('Ingrese un RUT para buscar', 'danger');
        return;
      }
      // Llama a la función para buscar usuarios por RUT
      searchUserByRut(rut)
        .then(results => {
          // Aquí puedes desplegar los resultados en tu interfaz. Por ahora mostramos un mensaje.
          showFlashMessage(`Se encontraron ${results.length} usuario(s)`, 'success');
          // Puedes implementar una lista o modal para mostrar los detalles.
        })
        .catch(error => {
          showFlashMessage('Error al buscar usuarios: ' + error.message, 'danger');
        });
    }
  });

// Función para mostrar mensajes flash en la interfaz
function showFlashMessage(message, category) { 
  const flashContainer = document.getElementById('flash-messages');
  if (!flashContainer) {
      console.error('No se encontró el contenedor de mensajes flash.');
      return;
  }

  const flashMessage = document.createElement('div');
  flashMessage.className = `alert ${category}`;
  flashMessage.textContent = message;

  flashContainer.appendChild(flashMessage);

  setTimeout(() => {
      flashMessage.remove();
  }, 5000);
}});