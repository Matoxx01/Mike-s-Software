import { uploadUser, searchUserByRut } from '../database/firebase.js';

document.addEventListener("DOMContentLoaded", () => {
  let fullscreenContainer = null;
  let savedSignature = null;

  const empleado = JSON.parse(localStorage.getItem('empleado'));
  if (empleado && empleado.name) {
      showFlashMessage(`Bienvenido ${empleado.name}!`, 'success');
  }

  // --- Toolbar ---
  const backBtn = document.querySelector('.toolbar-left button:nth-child(1)');
  const forwardBtn = document.querySelector('.toolbar-left button:nth-child(2)');
  const refreshBtn = document.querySelector('.toolbar-left button:nth-child(3)');
  const moreOptionsBtn = document.querySelector('.toolbar-right button');
  const moreOptionsMenu = document.getElementById('moreOptionsMenu');

  backBtn.addEventListener('click', () => window.history.back());
  forwardBtn.addEventListener('click', () => window.history.forward());
  refreshBtn.addEventListener('click', () => window.location.reload());

  if (!empleado || !empleado.admin) {
    const manageEmployeesItem = document.getElementById('manageEmployees');
    manageEmployeesItem.style.display = "none";
  }

  moreOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    moreOptionsMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    if (moreOptionsMenu.classList.contains('show')) {
      moreOptionsMenu.classList.remove('show');
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

  const openFullscreenBtn = document.getElementById('openFullscreenCanvas');
    let fullscreenSignaturePad;

    openFullscreenBtn.addEventListener('click', () => {
      savedSignature = null;

      // Crear contenedor fullscreen
      fullscreenContainer = document.createElement('div');
      fullscreenContainer.id = 'fullscreenContainer';
      
      // Crear canvas
      const canvas = document.createElement('canvas');
      canvas.id = 'fullscreenCanvas';
      fullscreenContainer.appendChild(canvas);
      
      // Crear botones
      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'fullscreen-buttons';
      
      const saveBtn = document.createElement('button');
      saveBtn.id = 'saveSignature';
      saveBtn.textContent = 'Guardar Firma';
      
      const clearBtn = document.createElement('button');
      clearBtn.id = 'clearFullCanvas';
      clearBtn.textContent = 'Limpiar Firma';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancelFullCanvas';
      cancelBtn.textContent = 'Cancelar';
      
      buttonsDiv.append(saveBtn, clearBtn, cancelBtn);
      fullscreenContainer.appendChild(buttonsDiv);
      
      document.body.appendChild(fullscreenContainer);
        
      // Entrar en pantalla completa
      if (fullscreenContainer.requestFullscreen) {
        fullscreenContainer.requestFullscreen().then(() => {
            initFullscreenCanvas();
        }).catch(err => {
            console.error('Error al entrar en pantalla completa:', err);
            fullscreenContainer.remove();
        });
      }
  });

  function initFullscreenCanvas() {
      const canvas = document.getElementById('fullscreenCanvas');
      
      // Configurar Signature Pad
      fullscreenSignaturePad = new SignaturePad(canvas, {
          backgroundColor: 'rgba(255, 255, 255, 0)'
      });
      
      // Ajustar tamaño
      const resizeCanvas = () => {
          canvas.width = fullscreenContainer.offsetWidth;
          canvas.height = fullscreenContainer.offsetHeight - 60; // 60px para botones
      };
      resizeCanvas();
      
      // Event listeners
      window.addEventListener('resize', resizeCanvas);
      
      // Botones
      document.getElementById('saveSignature').addEventListener('click', () => {
          if (fullscreenSignaturePad.isEmpty()) {
              showFlashMessage('Por favor, realiza una firma primero.', 'danger');
              return;
          }

          // Guardar la firma en la variable
          savedSignature = fullscreenSignaturePad.toDataURL('image/png');
          
          // Cerrar pantalla completa
          document.exitFullscreen();

          showFlashMessage('Firma guardada con éxito.', 'success');
      });
      
      document.getElementById('clearFullCanvas').addEventListener('click', () => {
          fullscreenSignaturePad.clear();
      });
      
      document.getElementById('cancelFullCanvas').addEventListener('click', () => {
          fullscreenSignaturePad.clear();
          savedSignature = null;
          document.exitFullscreen();
      });
  }

  // Manejar salida de pantalla completa
  document.addEventListener('fullscreenchange', (e) => {
      if (!document.fullscreenElement) {
          if (fullscreenContainer) {
              fullscreenContainer.remove();
              fullscreenSignaturePad = null;
              fullscreenContainer = null;
          }
      }
  });

  // --- Validación de inputs en tiempo real ---
  const inputRut = document.getElementById('rut');
  const inputNombre = document.getElementById('nombre');
  const inputApellido = document.getElementById('apellido');
  const inputCelular = document.getElementById('celular');
  const inputMail = document.getElementById('mail');

  inputRut.addEventListener('blur', () => {
    const isValid = validateRut(inputRut.value.trim());
    updateValidationIcon(inputRut, isValid);
  });

  inputNombre.addEventListener('blur', () => {
    const isValid = inputNombre.value.trim().length > 0;
    updateValidationIcon(inputNombre, isValid);
  });

  inputApellido.addEventListener('blur', () => {
    const isValid = inputApellido.value.trim().length > 0;
    updateValidationIcon(inputApellido, isValid);
  });

  inputCelular.addEventListener('blur', () => {
    const isValid = /^[0-9]{9}$/.test(inputCelular.value.trim());
    updateValidationIcon(inputCelular, isValid);
  });

  inputMail.addEventListener('blur', () => {
    // Una validación simple para email: contiene @ y . en la parte del dominio.
    const isValid = /\S+@\S+\.\S+/.test(inputMail.value.trim());
    updateValidationIcon(inputMail, isValid);
  });

  // --- Envío del formulario ---
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const rut = inputRut.value.trim();
    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const mail = inputMail.value.trim();
    const celular = inputCelular.value.trim();

    // Validaciones de cada campo
    if (!validateRut(rut)) {
      showFlashMessage("RUT inválido.", 'danger');
      return;
    }
    if (nombre === "") {
      showFlashMessage("El nombre no puede estar vacío.", 'danger');
      return;
    }
    if (apellido === "") {
      showFlashMessage("El apellido no puede estar vacío.", 'danger');
      return;
    }
    if (!/^[0-9]{9}$/.test(celular)) {
      showFlashMessage("El celular debe tener 9 dígitos numéricos.", 'danger');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(mail)) {
      showFlashMessage("El mail no es válido.", 'danger');
      return;
    }
    if (!savedSignature) {
      showFlashMessage("Por favor, realiza una firma primero.", 'danger');
      return;
  }

    const cleanedRut = rut.replace(/[\.\-]/g, '').toUpperCase();

    if (!validateRut(cleanedRut)) {
      showFlashMessage("RUT inválido.", 'danger');
      return;
    }

    const userData = {
      rut: cleanedRut,
      nombre,
      apellido,
      mail,
      celular,
      firma: savedSignature,
      timestamp: Date.now(),
      employeeAuthor: empleado ? empleado.name : "No Registrado"
    };

    uploadUser(userData)
      .then(() => {
        showFlashMessage('Usuario registrado con éxito.', 'success');
        form.reset();
        savedSignature = null;
      })
      .catch((error) => {
        // Mostrar mensaje específico si el error es por RUT duplicado
        if (error.message.includes('ya registrado')) {
          showFlashMessage(error.message, 'danger');
        } else {
          showFlashMessage('Error al registrar usuario: ' + error.message, 'danger');
        }
        console.error(error);
      });
  });
});

// Función para actualizar o crear el ícono de validación al lado del input
function updateValidationIcon(inputElement, isValid) {
  let icon = inputElement.parentNode.querySelector('.validation-icon');
  if (!icon) {
    icon = document.createElement('img');
    icon.className = 'validation-icon';
    // Agregamos el ícono después del input
    inputElement.parentNode.appendChild(icon);
  }
  icon.src = isValid ? '../assets/icons/check.svg' : '../assets/icons/equis.svg';
}

// Función para validar el RUT chileno con el algoritmo módulo 11
function validateRut(rut) {
  // Se remueven puntos, guiones y espacios, y se pasa a mayúsculas
  const cleaned = rut.replace(/[\.\-]/g, '').toUpperCase();
  if (cleaned.length < 2) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i)) * multiplier;
    multiplier = multiplier < 7 ? multiplier + 1 : 2;
  }
  const remainder = sum % 11;
  const expected = 11 - remainder;
  let expectedDV = "";
  if (expected === 11) {
    expectedDV = "0";
  } else if (expected === 10) {
    expectedDV = "K";
  } else {
    expectedDV = expected.toString();
  }
  return expectedDV === dv;
}

// Función para mostrar mensajes flash
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
