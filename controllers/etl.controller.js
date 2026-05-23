const db = require('../services/mysql.service');
const analytics = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ALERT_TYPES = {
  expiry_warning: 1,
  expired: 2,
  low_stock: 3,
  batch_depleted: 4
};

const parseTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  return new Date(timestamp);
};

const getFallbackUserId = async () => {
  const [users] = await db.query(
    'SELECT user_id FROM user WHERE is_active = TRUE ORDER BY role = "admin" DESC, user_id ASC LIMIT 1'
  );
  return users[0] ? users[0].user_id : 1;
};

const getValidUserId = async (userId, defaultUserId) => {
  if (!userId) return defaultUserId;
  const [exists] = await db.query('SELECT 1 FROM user WHERE user_id = ?', [userId]);
  return exists.length > 0 ? userId : defaultUserId;
};

const run = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Solo administradores pueden ejecutar el ETL', 403);
  }

  const events = await analytics.getAllEvents();
  console.log(`[ETL] ${events.length} eventos encontrados en Firebase`);
  const results = { alerts: 0, movements: 0, sessions: 0, skipped: 0 };

  const defaultUserId = await getFallbackUserId();

  for (const event of events) {
    try {
      if (event.event_type === 'expiry_event') {
        const inserted = await loadExpiryAlert(event, defaultUserId);
        if (inserted) results.alerts++;
        else results.skipped++;
      } else if (event.event_type === 'inventory_movement') {
        const inserted = await loadMovement(event, defaultUserId);
        if (inserted) results.movements++;
        else results.skipped++;
      } else if (event.event_type === 'user_session') {
        const inserted = await loadSession(event, defaultUserId);
        if (inserted) results.sessions++;
        else results.skipped++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      console.error(`[ETL Warning] Error procesando evento (${event.id}):`, err.message);
      results.skipped++;
    }
  }

  res.json({
    message: 'ETL completado',
    events_processed: events.length,
    results
  });
});

const loadExpiryAlert = async (event, defaultUserId) => {
  const event_data = event.data;
  const batchId = event_data.batch_id;

  const [batchExists] = await db.query('SELECT 1 FROM batch WHERE batch_id = ?', [batchId]);
  if (batchExists.length === 0) {
    console.warn(`[ETL Expiry Alert] Saltado: El lote #${batchId} no existe en MySQL.`);
    return false;
  }

  const isExpired = event_data.was_consumed === false;
  const alertTypeId = isExpired ? ALERT_TYPES.expired : ALERT_TYPES.batch_depleted;

  const [existing] = await db.query(
    'SELECT 1 FROM alert WHERE alert.title = ? AND alert.batch_id = ?',
    [`Lote #${batchId} - ${event_data.product_name}`, batchId]
  );
  if (existing.length > 0) return false;

  const userId = await getValidUserId(event.user_id, defaultUserId);

  let expiryDateFormatted = event_data.expiry_date;
  if (expiryDateFormatted && typeof expiryDateFormatted === 'object') {
    expiryDateFormatted = parseTimestamp(expiryDateFormatted).toISOString().split('T')[0];
  }

  await db.query(
    `INSERT INTO alert (alert.alert_type_id, alert.batch_id, alert.user_id, alert.title, alert.message, alert.created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      alertTypeId,
      batchId,
      userId,
      `Lote #${batchId} - ${event_data.product_name}`,
      isExpired
        ? `El producto ${event_data.product_name} venció el ${expiryDateFormatted}. Cantidad no consumida: ${event_data.quantity_expired}`
        : `Lote #${batchId} eliminado. Cantidad: ${event_data.quantity_expired}`,
      parseTimestamp(event.timestamp)
    ]
  );
  return true;
};

const loadMovement = async (event, defaultUserId) => {
  const event_data = event.data;
  const batchId = event_data.batch_id;

  const [batchExists] = await db.query('SELECT 1 FROM batch WHERE batch_id = ?', [batchId]);
  if (batchExists.length === 0) {
    console.warn(`[ETL Movement] Saltado: El lote #${batchId} no existe en MySQL.`);
    return false;
  }

  const [existing] = await db.query(
    `SELECT 1 FROM movement 
     WHERE movement.batch_id = ? AND movement.quantity = ? AND movement.reason LIKE '%Firebase%'`,
    [batchId, event_data.quantity]
  );
  if (existing.length > 0) return false;

  const movementTypeId = event_data.movement_type === 'purchase' ? 1 : 2;
  const userId = await getValidUserId(event.user_id, defaultUserId);

  await db.query(
    `INSERT INTO movement 
     (movement.batch_id, movement.movement_type_id, movement.user_id, movement.quantity, 
      movement.previous_quantity, movement.posterior_quantity, movement.reason, movement.datetime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      batchId, movementTypeId, userId, event_data.quantity,
      event_data.previous_quantity, event_data.posterior_quantity,
      `ETL desde Firebase - ${event_data.movement_type}`,
      parseTimestamp(event.timestamp)
    ]
  );
  return true;
};

const loadSession = async (event, defaultUserId) => {
  const event_data = event.data;
  const parsedTime = parseTimestamp(event.timestamp);

  const userId = await getValidUserId(event.user_id, defaultUserId);
  const [existing] = await db.query(
    'SELECT 1 FROM audit_session WHERE audit_session.user_id = ? AND audit_session.start_time = ?',
    [userId, parsedTime]
  );
  if (existing.length > 0) return false;

  await db.query(
    `INSERT INTO audit_session (audit_session.user_id, audit_session.token_hash, audit_session.ip_address, audit_session.user_agent, audit_session.start_time)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, 'etl-import', event_data.ip || '', event_data.user_agent || '', parsedTime]
  );
  return true;
};

module.exports = { run };
