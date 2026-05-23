const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'env/freshstock-b9742-firebase-adminsdk-fbsvc-d36842a81d.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };
