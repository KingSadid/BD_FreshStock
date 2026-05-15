const { db } = require('./firebase.service');

const COLLECTION = 'analytics_events';

const saveEvent = async (eventType, userId, data) => {
  const doc = {
    event_type: eventType,
    timestamp: new Date(),
    user_id: userId || null,
    data,
    metadata: { source: 'web', app_version: '1.0' }
  };
  const ref = await db.collection(COLLECTION).add(doc);
  console.log(`[Firebase] Evento '${eventType}' guardado → ${ref.id}`);
};

const logMovement = async (userId, movement) => {
  await saveEvent('inventory_movement', userId, {
    product_sku: movement.product_sku,
    batch_id: movement.batch_id,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    previous_quantity: movement.previous_quantity,
    posterior_quantity: movement.posterior_quantity
  });
};

const logStockSnapshot = async (userId, snapshot) => {
  await saveEvent('stock_snapshot', userId, {
    product_sku: snapshot.product_sku,
    batch_id: snapshot.batch_id,
    current_quantity: snapshot.current_quantity,
    expiry_date: snapshot.expiry_date
  });
};

const logUserSession = async (userId, session) => {
  await saveEvent('user_session', userId, {
    email: session.email,
    role: session.role,
    ip: session.ip,
    user_agent: session.user_agent
  });
};

const logExpiryEvent = async (userId, expiry) => {
  await saveEvent('expiry_event', userId, {
    batch_id: expiry.batch_id,
    product_sku: expiry.product_sku,
    product_name: expiry.product_name,
    expiry_date: expiry.expiry_date,
    was_consumed: expiry.was_consumed || false,
    quantity_expired: expiry.quantity_expired
  });
};

const logProductView = async (userId, product) => {
  await saveEvent('product_view', userId, {
    product_sku: product.product_sku,
    product_name: product.product_name
  });
};

const getAllEvents = async () => {
  const snapshot = await db.collection(COLLECTION).orderBy('timestamp', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getEventsByType = async (eventType) => {
  const snapshot = await db.collection(COLLECTION)
    .where('event_type', '==', eventType)
    .orderBy('timestamp', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  saveEvent,
  logMovement,
  logStockSnapshot,
  logUserSession,
  logExpiryEvent,
  logProductView,
  getAllEvents,
  getEventsByType
};
