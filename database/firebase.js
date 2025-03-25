import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, get, query, orderByChild, startAt, endAt } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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
