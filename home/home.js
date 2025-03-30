import { uploadUser, searchUserByRut } from '../database/firebase.js';

document.addEventListener("DOMContentLoaded", () => {
  // Inicializa Signature Pad sobre el canvas
  const canvas = document.getElementById('firmaCanvas');
  const signaturePad = new SignaturePad(canvas);
  const clearButton = document.getElementById("clearCanvas");

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

  clearButton.addEventListener("click", () => {
    signaturePad.clear();
  });

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
    if (signaturePad.isEmpty()) {
      showFlashMessage("Por favor, realiza una firma primero.", 'danger');
      return;
    }

    const firma = signaturePad.toDataURL('image/png');
    const userData = {
      rut,
      nombre,
      apellido,
      mail,
      celular,
      firma,
      timestamp: Date.now(),
      employeeAuthor: empleado ? empleado.name : "No Registrado"
    };

    uploadUser(userData)
      .then(() => {
        showFlashMessage('Usuario registrado con éxito.', 'success');
        form.reset();
        signaturePad.clear();
        // También se pueden remover los íconos de validación si se desea.
      })
      .catch((error) => {
        showFlashMessage('Error al registrar usuario: ' + error.message, 'danger');
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
