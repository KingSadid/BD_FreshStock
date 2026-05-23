const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
let resolvedPath = path.join(__dirname, '..', 'env', 'freshstock_key.json');

if (envPath) {
  const potentialPath = path.resolve(envPath);
  if (fs.existsSync(potentialPath)) {
    resolvedPath = potentialPath;
  } else {
    const rootPotentialPath = path.join(__dirname, '..', envPath);
    if (fs.existsSync(rootPotentialPath)) {
      resolvedPath = rootPotentialPath;
    }
  }
}

console.log(`[Firebase] Cargando credenciales desde: ${resolvedPath}`);
const serviceAccount = require(resolvedPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
