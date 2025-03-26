import { uploadUser, searchUserByRut } from '../database/firebase.js';

// Inicialización cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa Signature Pad sobre el canvas (asegúrate de haber cambiado el textarea por un canvas en el HTML)
  const canvas = document.getElementById('firmaCanvas');
  const signaturePad = new SignaturePad(canvas);
  const clearButton = document.getElementById("clearCanvas");

  // Obtén el nombre del localStorage
  const empleado = JSON.parse(localStorage.getItem('empleado'));

  // Si hay un empleado guardado, muestra el mensaje de bienvenida
  if (empleado && empleado.name) {
      showFlashMessage(`Bienvenido ${empleado.name}!`, 'success');
  }

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

  clearButton.addEventListener("click", function () {
    signaturePad.clear();
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

  // Cerrar el menú al hacer clic en cualquier parte fuera del menú
  document.addEventListener('click', (e) => {
    if (moreOptionsMenu.style.display === "block") {
      moreOptionsMenu.style.display = "none";
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

  // --- Envío del formulario ---
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Recopila datos del formulario
    const rut = document.getElementById('rut').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const mail = document.getElementById('mail').value.trim();
    const celular = document.getElementById('celular').value.trim();

    // Verifica que se haya realizado la firma
    if (signaturePad.isEmpty()) {
      showFlashMessage("Por favor, realiza una firma primero.", 'danger');
      return;
    }
    // Obtén la firma en formato base64 (imagen PNG)
    const firma = signaturePad.toDataURL('image/png');

    // Crea el objeto con los datos del usuario
    const userData = {
      rut,
      nombre,
      apellido,
      mail,
      celular,
      firma,
      timestamp: new Date().toISOString()
    };

    // Llama a la función para subir el usuario a Firebase
    uploadUser(userData)
      .then(() => {
        showFlashMessage('Usuario registrado con éxito.', 'success');
        // Limpia el formulario y el canvas de la firma
        form.reset();
        signaturePad.clear();
      })
      .catch((error) => {
        showFlashMessage('Error al registrar usuario: ' + error.message, 'danger');
        console.error(error);
      });
  });
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
}
