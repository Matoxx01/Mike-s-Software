import { searchEmployee } from './database/firebase.js';

// Evento para detectar "Enter" en el input
document.getElementById("clave").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
      event.preventDefault(); // Evita el comportamiento por defecto
      document.getElementById("btnIngresar").click(); // Simula el clic en el botón
  }
});

// Evento del botón "Ingresar"
document.getElementById('btnIngresar').addEventListener('click', async () => {
  const clave = document.getElementById('clave').value.trim();
  if (!clave) {
    showFlashMessage("Por favor, ingresa una clave", 'danger');
    console.error("Por favor, ingresa una clave");
    return;
  }
  
  try {
    const empleado = await searchEmployee(clave);  // Llamar a la función desde firebase.js
    if (empleado) {

      // Guarda localmente los datos (name, admin y clave)
      localStorage.setItem('empleado', JSON.stringify({
        name: empleado.name,
        admin: !!empleado.admin,
        clave: clave
      }));

      // Redirige a la página de inicio
      window.location.href = 'home/home.html';
    } else {
      showFlashMessage("Empleado no encontrado", 'danger');
    }
  } catch (error) {
    showFlashMessage("Error al buscar empleado", 'danger');
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
}
