const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'env', 'freshstock_key.json'));

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
