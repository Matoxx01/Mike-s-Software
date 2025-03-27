import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  query, 
  orderByChild, 
  startAt, 
  endAt,
  remove
 } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf42kc0ow6yTt4Twq1HE2BbhTaigbqZEI",
  authDomain: "mike-s-software.firebaseapp.com",
  databaseURL: "https://mike-s-software-default-rtdb.firebaseio.com",
  projectId: "mike-s-software",
  storageBucket: "mike-s-software.firebasestorage.app",
  messagingSenderId: "117911280201",
  appId: "1:117911280201:web:8b0f919aa69a02c2637d98",
  measurementId: "G-2Y98NS1BFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * 📌 Función para subir un usuario a Firebase
 * @param {Object} userData - Datos del usuario a subir
 * @returns {Promise<void>}
 */
export async function uploadUser(userData) {
  if (!userData.rut) {
    throw new Error("El RUT es obligatorio para registrar un usuario.");
  }

  const userRef = ref(db, `usuarios/${userData.rut}`);

  try {
    await set(userRef, userData);
    console.log("Usuario registrado con éxito en Firebase.");
  } catch (error) {
    console.error("Error al registrar usuario en Firebase:", error);
    throw error;
  }
}

/**
 * 📌 Función para buscar usuarios por RUT en Firebase
 * @param {string} rut - RUT del usuario a buscar
 * @returns {Promise<Object[]>} - Lista de usuarios encontrados
 */
export async function searchUserByRut(rut) {
  const usersRef = ref(db, "usuarios");

  // Query para buscar usuarios cuyo RUT coincida parcial o completamente
  const rutQuery = query(usersRef, orderByChild("rut"), startAt(rut), endAt(rut + "\uf8ff"));

  try {
    const snapshot = await get(rutQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const users = [];
    snapshot.forEach((childSnapshot) => {
      users.push(childSnapshot.val());
    });

    return users;
  } catch (error) {
    console.error("Error al buscar usuario por RUT en Firebase:", error);
    throw error;
  }
}

/**
 * Función para buscar un empleado en Firebase
 * usando la clave ingresada en la ruta `empleados/{clave}`.
 * @param {string} clave - La clave del empleado a buscar.
 * @returns {Promise<Object|null>} - Objeto con los datos del empleado o null si no existe.
 */
export async function searchEmployee(clave) {
  const employeeRef = ref(db, `empleados/${clave}`);
  try {
    const snapshot = await get(employeeRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error al buscar empleado:", error);
    throw error;
  }
}

/**
 * Función para buscar todos los usuarios registrados en Firebase.
 * Retorna una promesa que se resuelve con un arreglo de usuarios.
 * Cada usuario tendrá sus atributos y se agregará el campo 'id' con su clave.
 * @returns {Promise<Object[]>} - Lista de usuarios
 */
export async function usersearch() {
  const usersRef = ref(db, "usuarios");

  try {
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      return [];
    }

    const users = [];
    snapshot.forEach((childSnapshot) => {
      let user = childSnapshot.val();
      // Se asigna el id como la clave de cada usuario (en este caso el rut)
      user.id = childSnapshot.key;
      users.push(user);
    });

    return users;
  } catch (error) {
    console.error("Error al obtener usuarios de Firebase:", error);
    throw error;
  }
}

/**
 * Función para eliminar un usuario a partir de su identificador (RUT).
 * Retorna una promesa que se resuelve al completar la eliminación.
 * @param {string} id - El RUT (clave) del usuario a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  const userRef = ref(db, `usuarios/${id}`);
  try {
    await remove(userRef);
    console.log(`Usuario con id ${id} eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar usuario en Firebase:", error);
    throw error;
  }
}

/**
 * Función para obtener todos los empleados registrados en Firebase.
 * Retorna una promesa que se resuelve con un arreglo de empleados.
 * Cada empleado tendrá sus atributos y se agregará el campo 'id' con su clave.
 * @returns {Promise<Object[]>} - Lista de empleados.
 */
export async function employeeSearch() {
  const employeesRef = ref(db, "empleados");
  try {
    const snapshot = await get(employeesRef);
    if (!snapshot.exists()) {
      return [];
    }
    const employees = [];
    snapshot.forEach((childSnapshot) => {
      let employee = childSnapshot.val();
      // Asignamos la clave del empleado al campo id para identificarlo
      employee.id = childSnapshot.key;
      employees.push(employee);
    });
    return employees;
  } catch (error) {
    console.error("Error al obtener empleados de Firebase:", error);
    throw error;
  }
}

/**
 * Función para eliminar un empleado a partir de su clave.
 * @param {string} clave - La clave del empleado a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteEmployee(clave) {
  const employeeRef = ref(db, `empleados/${clave}`);
  try {
    await remove(employeeRef);
    console.log(`Empleado con clave ${clave} eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar empleado en Firebase:", error);
    throw error;
  }
}

/**
 * Función para cambiar el estado de administrador de un empleado.
 * @param {string} clave - La clave del empleado.
 * @param {boolean} newAdminStatus - Nuevo estado de administrador.
 * @returns {Promise<void>}
 */
export async function makeOrNotAdmin(clave, newAdminStatus) {
  const employeeRef = ref(db, `empleados/${clave}`);
  try {
    // Primero se obtiene el empleado para conservar el resto de los datos
    const snapshot = await get(employeeRef);
    if (snapshot.exists()) {
      const employeeData = snapshot.val();
      employeeData.admin = newAdminStatus;
      await set(employeeRef, employeeData);
      console.log(`Estado admin actualizado para el empleado con clave ${clave}`);
    } else {
      throw new Error("Empleado no encontrado");
    }
  } catch (error) {
    console.error("Error al actualizar estado admin en Firebase:", error);
    throw error;
  }
}

// Función para agregar un empleado
export function addEmployee({ clave, name, admin }) {
  const db = getDatabase();
  const employeeRef = ref(db, `empleados/${clave}`);

  return set(employeeRef, {
    clave,
    name,
    admin
  });
}