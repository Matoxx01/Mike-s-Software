import { createExcel, searchUserByRut, usersearch, deleteUser } from '../../database/firebase.js';

// Inicialización cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {

  // Obtén el nombre del localStorage
  const empleado = JSON.parse(localStorage.getItem('empleado'));

  // --- Eventos de la Toolbar ---

  // Botones de navegación
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

  // Si el usuario no es admin, ocultamos la opción de "Gestión de empleados"
  if (!empleado || !empleado.admin) {
    const manageEmployeesItem = document.getElementById('manageEmployees');
    manageEmployeesItem.style.display = "none";
  }

  moreOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moreOptionsMenu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (moreOptionsMenu.classList.contains('show')) {
      moreOptionsMenu.classList.remove('show');
    }
  });

  document.getElementById('excelCreate').addEventListener('click', async () => {
    try {
      await createExcel();
      showFlashMessage('Excel creado exitosamente', 'success');
    } catch (error) {
      showFlashMessage('Error al crear Excel: ' + error.message, 'danger');
    }
  });

  // --- Búsqueda de usuario por RUT en la barra de búsqueda de la toolbar ---
  const searchInput = document.querySelector('.toolbar-center input');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rut = searchInput.value.trim();
      if (!rut) {
        showFlashMessage('Ingrese un RUT para buscar', 'danger');
        return;
      }
      searchUserByRut(rut)
        .then(results => {
          showFlashMessage(`Se encontraron ${results.length} usuario(s)`, 'success');
          // Aquí puedes implementar la visualización de resultados adicionales si lo deseas.
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
  }

  // Función para cargar los usuarios en la tabla
  function loadUsers() {
    usersearch()
      .then(users => {
         const tbody = document.querySelector('#usersTable tbody');
         tbody.innerHTML = ''; // Limpiar tabla
         users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.rut}</td>
                <td>${user.apellido}</td>
                <td>${user.nombre}</td>
                <td>${user.celular}</td>
                <td>${user.mail}</td>
                <td>${user.employeeAuthor}</td>
                <td><button class="delete-btn" data-id="${user.id}">Eliminar</button></td>
            `;
            tbody.appendChild(tr);
         });
      })
      .catch(error => {
         showFlashMessage('Error al cargar usuarios: ' + error.message, 'danger');
      });
  }

  // Variables y funciones para el modal de confirmación
  const confirmModal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  let pendingDeleteId = null;

  // Función para abrir el modal con un título y mensaje personalizados
  function openConfirmModal(title, message, id) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    pendingDeleteId = id;
    confirmModal.style.display = 'block';
  }

  // Función para cerrar el modal
  function closeConfirmModal() {
    confirmModal.style.display = 'none';
    pendingDeleteId = null;
  }

  // Eventos para botones del modal
  cancelBtn.addEventListener('click', () => {
    closeConfirmModal();
  });

  confirmBtn.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteUser(pendingDeleteId)
        .then(() => {
           showFlashMessage('Usuario eliminado correctamente', 'success');
           loadUsers();
        })
        .catch(error => {
           showFlashMessage('Error al eliminar usuario: ' + error.message, 'danger');
        })
        .finally(() => {
          closeConfirmModal();
        });
    }
  });

  // Evento delegado para la eliminación de usuario: abre el modal de confirmación
  document.querySelector('#usersTable tbody').addEventListener('click', (e) => {
    if(e.target.classList.contains('delete-btn')) {
         const id = e.target.getAttribute('data-id');
         // Puedes personalizar el título y mensaje según necesites
         openConfirmModal("Confirmar eliminación", "¿Estás seguro de eliminar el usuario?", id);
    }
  });

  // Buscador para filtrar la tabla (filtra por rut, apellido o nombre)
  document.getElementById('tableSearchInput').addEventListener('keyup', function(){
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tbody tr');
    rows.forEach(row => {
         const rut = row.cells[0].textContent.toLowerCase();
         const apellido = row.cells[1].textContent.toLowerCase();
         const nombre = row.cells[2].textContent.toLowerCase();
         if(rut.indexOf(filter) > -1 || apellido.indexOf(filter) > -1 || nombre.indexOf(filter) > -1) {
              row.style.display = "";
         } else {
              row.style.display = "none";
         }
    });
  });

  // Cargar los usuarios al iniciar
  loadUsers();
});
