import { 
  employeeSearch, 
  deleteEmployee, 
  makeOrNotAdmin, 
  uploadEmployee, 
  searchUserByRut 
} from '../../database/firebase.js';

document.addEventListener("DOMContentLoaded", () => {

  // Obtiene el empleado almacenado en localStorage
  const empleado = JSON.parse(localStorage.getItem('empleado'));

  // --- Eventos de la Toolbar ---
  const backBtn = document.querySelector('.toolbar-left button:nth-child(1)');
  const forwardBtn = document.querySelector('.toolbar-left button:nth-child(2)');
  const refreshBtn = document.querySelector('.toolbar-left button:nth-child(3)');
  const moreOptionsBtn = document.querySelector('.toolbar-right button');
  const moreOptionsMenu = document.getElementById('moreOptionsMenu');

  if (backBtn) backBtn.addEventListener('click', () => window.history.back());
  if (forwardBtn) forwardBtn.addEventListener('click', () => window.history.forward());
  if (refreshBtn) refreshBtn.addEventListener('click', () => window.location.reload());

  
  const addEmployeeModal = document.getElementById('addEmployeeModal');
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  const cancelAddBtn = document.getElementById('cancelAddBtn');

  addBtn.addEventListener('click', () => {
    // Abre el modal de agregar empleado
    addEmployeeModal.style.display = "flex";
  });
  
  // Cierra el modal si se presiona "Cancelar"
  cancelAddBtn.addEventListener('click', () => {
    addEmployeeModal.style.display = "none";
    addEmployeeForm.reset();
  });
  
  // Manejo del envío del formulario para agregar empleado
  addEmployeeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clave = document.getElementById('claveInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    const admin = document.getElementById('adminInput').checked;
  
    if (!clave || !name) {
      showFlashMessage("Complete los campos requeridos", "danger");
      return;
    }
  
    // Llamada a la función uploadEmployee desde firebase.js
    uploadEmployee(clave, name, admin)
      .then(() => {
        showFlashMessage("Empleado añadido correctamente", "success");
        loadEmployees(); // Recarga la tabla de empleados
        addEmployeeModal.style.display = "none";
        addEmployeeForm.reset();
      })
      .catch(error => {
        showFlashMessage("Error al añadir empleado: " + error.message, "danger");
      });
  });

  // Oculta "Gestión de empleados" si el usuario no es admin
  if (!empleado?.admin) {
    const manageEmployeesItem = document.getElementById('manageEmployees');
    if (manageEmployeesItem) manageEmployeesItem.style.display = "none";
  }

  // Alterna el menú de opciones
  if (moreOptionsBtn) {
    moreOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moreOptionsMenu?.classList.toggle('show');
    });
  }

  // Cierra el menú si se hace clic fuera
  document.addEventListener('click', (e) => {
    if (moreOptionsMenu?.classList.contains('show')) {
      moreOptionsMenu.classList.remove('show');
    }
  });

  // --- Búsqueda de usuario por RUT ---
  const searchInputRut = document.querySelector('.toolbar-center input');
  if (searchInputRut) {
    searchInputRut.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const rut = searchInputRut.value.trim();
        if (!rut) return showFlashMessage('Ingrese un RUT para buscar', 'danger');

        searchUserByRut(rut)
          .then(results => showFlashMessage(`Se encontraron ${results.length} usuario(s)`, 'success'))
          .catch(error => showFlashMessage('Error al buscar usuarios: ' + error.message, 'danger'));
      }
    });
  }

  // --- Configuración del modal de confirmación ---
  const confirmModal = document.getElementById('confirmModal');
  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');

  let employeeToDelete = null; // Variable para almacenar el empleado que se eliminará

  function openConfirmModal(title, message, id) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    employeeToDelete = id;
    confirmModal.style.display = "flex"; // Asegurar que el modal se muestre
  }

  function closeConfirmModal() {
    confirmModal.style.display = "none"; // Ocultar modal
    employeeToDelete = null; // Limpiar variable
  }

  cancelBtn.addEventListener('click', closeConfirmModal);

  confirmBtn.addEventListener('click', () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete)
        .then(() => {
          showFlashMessage("Empleado eliminado correctamente.", "success");
          loadEmployees();
        })
        .catch(error => {
          showFlashMessage("Error al eliminar: " + error.message, "danger");
        })
        .finally(() => {
          closeConfirmModal();
        });
    }
  });

  // --- Carga y visualización de empleados ---
  const employeeTableBody = document.querySelector('#employeeTable tbody');

  function loadEmployees() {
    if (!employeeTableBody) return;
    employeeSearch()
      .then(employees => {
        employeeTableBody.innerHTML = ''; // Limpia la tabla antes de actualizar
        employees.forEach(emp => {
          const tr = document.createElement('tr');

          // Columna: Nombre
          const tdName = document.createElement('td');
          tdName.textContent = emp.name;
          tr.appendChild(tdName);

          // Columna: Admin
          const tdAdmin = document.createElement('td');
          tdAdmin.textContent = emp.admin ? 'Sí' : 'No';
          tr.appendChild(tdAdmin);

          // Columna: Acciones
          const tdActions = document.createElement('td');

          // Botón: Eliminar (Ahora abre el modal)
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Eliminar';
          deleteBtn.classList.add('deleteButton');
          deleteBtn.addEventListener('click', () => openConfirmModal("Confirmar eliminación", `¿Estás seguro de eliminar a ${emp.name}?`, emp.id));
          tdActions.appendChild(deleteBtn);

          // Botón: Cambiar admin
          const toggleAdminBtn = document.createElement('button');
          toggleAdminBtn.textContent = emp.admin ? 'Quitar Admin' : 'Hacer Admin';
          toggleAdminBtn.classList.add(emp.admin ? 'removeAdmin' : 'makeAdmin');
          toggleAdminBtn.addEventListener('click', () => handleToggleAdmin(emp.id, emp.admin, emp.name));
          tdActions.appendChild(toggleAdminBtn);

          tr.appendChild(tdActions);
          employeeTableBody.appendChild(tr);
        });
      })
      .catch(error => showFlashMessage('Error al obtener empleados: ' + error.message, 'danger'));
  }
  loadEmployees();

  // --- Buscador de empleados por {name} ---
  const nameSearchInput = document.getElementById('nameSearchInput');
  if (nameSearchInput) {
    nameSearchInput.addEventListener('input', () => {
      const filter = nameSearchInput.value.toLowerCase();
      const rows = employeeTableBody?.getElementsByTagName('tr') || [];
      Array.from(rows).forEach(row => {
        const nameCell = row.getElementsByTagName('td')[0];
        if (nameCell) {
          row.style.display = nameCell.textContent.toLowerCase().includes(filter) ? '' : 'none';
        }
      });
    });
  }

  function handleToggleAdmin(id, isAdmin, name) {
    makeOrNotAdmin(id, !isAdmin)
      .then(() => {
        showFlashMessage(`Estado admin de ${name} actualizado.`, 'success');
        loadEmployees();
      })
      .catch(error => showFlashMessage('Error al actualizar estado: ' + error.message, 'danger'));
  }

  function showFlashMessage(message, category) {
    const flashContainer = document.getElementById('flash-messages');
    if (!flashContainer) return console.error('No se encontró el contenedor de mensajes flash.');
    
    const flashMessage = document.createElement('div');
    flashMessage.className = `alert ${category}`;
    flashMessage.textContent = message;
    flashContainer.appendChild(flashMessage);
    
    setTimeout(() => flashMessage.remove(), 5000);
  }
});
