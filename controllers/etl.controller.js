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

const run = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Solo administradores pueden ejecutar el ETL', 403);
  }

  const events = await analytics.getAllEvents();
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
      results.skipped++;
    }
  }

  res.json({
    message: 'ETL completado',
    events_processed: events.length,
    results
  });
});

const loadExpiryAlert = async (event) => {
  const d = event.data;
  const isExpired = d.was_consumed === false;
  const alertTypeId = isExpired ? ALERT_TYPES.expired : ALERT_TYPES.batch_depleted;

  const [existing] = await db.query(
    'SELECT 1 FROM alert WHERE title = ? AND batch_id = ?',
    [`Lote #${d.batch_id} - ${d.product_name}`, d.batch_id]
  );
  if (existing.length > 0) return false;

  const userId = event.user_id || 1;
  await db.query(
    `INSERT INTO alert (alert_type_id, batch_id, user_id, title, message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      alertTypeId,
      d.batch_id,
      userId,
      `Lote #${d.batch_id} - ${d.product_name}`,
      isExpired
        ? `El producto ${d.product_name} venció el ${d.expiry_date}. Cantidad no consumida: ${d.quantity_expired}`
        : `Lote #${d.batch_id} eliminado. Cantidad: ${d.quantity_expired}`
    ]
  );
  return true;
};

const loadMovement = async (event) => {
  const d = event.data;

  const [existing] = await db.query(
    `SELECT 1 FROM movement 
     WHERE batch_id = ? AND quantity = ? AND reason LIKE '%Firebase%'`,
    [d.batch_id, d.quantity]
  );
  if (existing.length > 0) return false;

  const movementTypeId = d.movement_type === 'purchase' ? 1 : 2;
  const userId = event.user_id || 1;

  await db.query(
    `INSERT INTO movement 
     (batch_id, movement_type_id, user_id, quantity, 
      previous_quantity, posterior_quantity, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      d.batch_id, movementTypeId, userId, d.quantity,
      d.previous_quantity, d.posterior_quantity,
      `ETL desde Firebase - ${d.movement_type}`
    ]
  );
  return true;
};

const loadSession = async (event) => {
  const d = event.data;

  const userId = event.user_id || 1;
  const [existing] = await db.query(
    'SELECT 1 FROM audit_session WHERE user_id = ? AND start_time = ?',
    [userId, event.timestamp]
  );
  if (existing.length > 0) return false;

  await db.query(
    `INSERT INTO audit_session (user_id, token_hash, ip_address, user_agent, start_time)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, 'etl-import', d.ip || '', d.user_agent || '', event.timestamp]
  );
  return true;
};

module.exports = { run };
