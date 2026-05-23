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

const loadExpiryAlert = async (event) => {
  const event_data = event.data;
  const isExpired = event_data.was_consumed === false;
  const alertTypeId = isExpired ? ALERT_TYPES.expired : ALERT_TYPES.batch_depleted;

  const [existing] = await db.query(
    'SELECT 1 FROM alert WHERE alert.title = ? AND alert.batch_id = ?',
    [`Lote #${event_data.batch_id} - ${event_data.product_name}`, event_data.batch_id]
  );
  if (existing.length > 0) return false;

  const userId = event.user_id || 1;
  await db.query(
    `INSERT INTO alert (alert.alert_type_id, alert.batch_id, alert.user_id, alert.title, alert.message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      alertTypeId,
      event_data.batch_id,
      userId,
      `Lote #${event_data.batch_id} - ${event_data.product_name}`,
      isExpired
        ? `El producto ${event_data.product_name} venció el ${event_data.expiry_date}. Cantidad no consumida: ${event_data.quantity_expired}`
        : `Lote #${event_data.batch_id} eliminado. Cantidad: ${event_data.quantity_expired}`
    ]
  );
  return true;
};

const loadMovement = async (event) => {
  const event_data = event.data;

  const [existing] = await db.query(
    `SELECT 1 FROM movement 
     WHERE movement.batch_id = ? AND movement.quantity = ? AND movement.reason LIKE '%Firebase%'`,
    [event_data.batch_id, event_data.quantity]
  );
  if (existing.length > 0) return false;

  const movementTypeId = event_data.movement_type === 'purchase' ? 1 : 2;
  const userId = event.user_id || 1;

  await db.query(
    `INSERT INTO movement 
     (movement.batch_id, movement.movement_type_id, movement.user_id, movement.quantity, 
      movement.previous_quantity, movement.posterior_quantity, movement.reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      event_data.batch_id, movementTypeId, userId, event_data.quantity,
      event_data.previous_quantity, event_data.posterior_quantity,
      `ETL desde Firebase - ${event_data.movement_type}`
    ]
  );
  return true;
};

const loadSession = async (event) => {
  const event_data = event.data;

  const userId = event.user_id || 1;
  const [existing] = await db.query(
    'SELECT 1 FROM audit_session WHERE audit_session.user_id = ? AND audit_session.start_time = ?',
    [userId, event.timestamp]
  );
  if (existing.length > 0) return false;

  await db.query(
    `INSERT INTO audit_session (audit_session.user_id, audit_session.token_hash, audit_session.ip_address, audit_session.user_agent, audit_session.start_time)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, 'etl-import', event_data.ip || '', event_data.user_agent || '', event.timestamp]
  );
  return true;
};

const run = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Solo administradores pueden ejecutar el ETL', 403);
  }

  const events = await analytics.getAllEvents();
  console.log(`[Manual ETL] ${events.length} eventos encontrados en Firebase`);
  const results = { alerts: 0, movements: 0, sessions: 0, skipped: 0 };

  for (const event of events) {
    try {
      if (event.event_type === 'expiry_event') {
        const inserted = await loadExpiryAlert(event);
        if (inserted) results.alerts++;
        else results.skipped++;
      } else if (event.event_type === 'inventory_movement') {
        const inserted = await loadMovement(event);
        if (inserted) results.movements++;
        else results.skipped++;
      } else if (event.event_type === 'user_session') {
        const inserted = await loadSession(event);
        if (inserted) results.sessions++;
        else results.skipped++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      console.error(`[Manual ETL Error] Error processing event ${event.id}:`, err.message);
      results.skipped++;
    }
  }

  res.json({
    message: 'ETL completado',
    events_processed: events.length,
    results
  });
});

module.exports = { run };
