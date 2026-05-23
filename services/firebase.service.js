const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;

// Primero intentar cargar desde una variable de entorno (ideal para producción y GitHub seguro)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('[Firebase Error] No se pudo parsear la variable FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
}

// Fallback al archivo local si no hay variable de entorno
if (!serviceAccount) {
  try {
    serviceAccount = require(path.join(__dirname, '..', 'env', 'freshstock_key.json'));
  } catch (err) {
    console.error('[Firebase Error] No se encontró el archivo de credenciales local env/freshstock_key.json:', err.message);
    throw new Error('Falta la configuración de Firebase (Key JSON o Variable de Entorno).');
  }
}

// Formatear de forma robusta la llave privada si contiene caracteres escapados o carece de cabeceras
if (serviceAccount.private_key && !serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
  serviceAccount.private_key = `-----BEGIN PRIVATE KEY-----\n${serviceAccount.private_key.replace(/\\n/g, '\n')}\n-----END PRIVATE KEY-----\n`;
} else if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
