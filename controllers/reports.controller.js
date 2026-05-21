const reportsDao = require('../dao/reports.dao');
const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');

const inventoryValuation = asyncHandler(async (req, res) => {
  const data = await reportsDao.getInventoryValuation(req.query.category_id);
  res.json(data);
});

const movementHistory = asyncHandler(async (req, res) => {
  const data = await reportsDao.getMovementHistory(req.query);
  res.json(data);
});

const wasteReport = asyncHandler(async (req, res) => {
  const data = await reportsDao.getWasteReport(req.query);
  res.json(data);
});

const movementTypes = asyncHandler(async (req, res) => {
  const data = await reportsDao.getMovementTypes();
  res.json(data);
});

const firebaseReport = asyncHandler(async (req, res) => {
  const allEvents = await analyticsService.getAllEvents();

  // Aggregate by event type
  const byType = {};
  const timeline = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last7Days = {};
  const last30Days = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days[d.toISOString().split('T')[0]] = 0;
  }
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days[d.toISOString().split('T')[0]] = 0;
  }

  allEvents.forEach(event => {
    const type = event.event_type || 'unknown';
    if (!byType[type]) {
      byType[type] = { count: 0, events: [] };
    }
    byType[type].count++;
    byType[type].events.push(event);

    // Timeline aggregation
    const dateStr = event.timestamp && event.timestamp.toDate
      ? event.timestamp.toDate().toISOString().split('T')[0]
      : (event.timestamp ? new Date(event.timestamp).toISOString().split('T')[0] : null);

    if (dateStr) {
      if (timeline[dateStr]) timeline[dateStr]++;
      else timeline[dateStr] = 1;

      if (last7Days.hasOwnProperty(dateStr)) last7Days[dateStr]++;
      if (last30Days.hasOwnProperty(dateStr)) last30Days[dateStr]++;
    }
  });

  // Build summary
  const summary = {
    total_events: allEvents.length,
    event_types: Object.keys(byType).length,
    by_type: Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: allEvents.length > 0 ? ((data.count / allEvents.length) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count),
    timeline_7d: Object.entries(last7Days).sort(([a], [b]) => a.localeCompare(b)),
    timeline_30d: Object.entries(last30Days).sort(([a], [b]) => a.localeCompare(b)),
    recent_events: allEvents.slice(0, 50).map(e => ({
      id: e.id,
      event_type: e.event_type,
      timestamp: e.timestamp && e.timestamp.toDate ? e.timestamp.toDate().toISOString() : e.timestamp,
      user_id: e.user_id,
      data: e.data
    }))
  };

  res.json(summary);
});

const mysqlVerification = asyncHandler(async (req, res) => {
  const db = require('../services/mysql.service');

  // Count movements imported from Firebase
  const [movementCountRows] = await db.query(
    `SELECT COUNT(*) as total, MAX(datetime) as last_date 
     FROM movement 
     WHERE reason LIKE '%Firebase%' OR reason LIKE '%ETL%'`
  );

  // Count alerts imported from Firebase
  const [alertCountRows] = await db.query(
    `SELECT COUNT(*) as total, MAX(created_at) as last_date 
     FROM alert 
     WHERE title LIKE 'Lote #%'`
  );

  // Count sessions imported from Firebase
  const [sessionCountRows] = await db.query(
    `SELECT COUNT(*) as total, MAX(start_time) as last_date 
     FROM audit_session 
     WHERE token_hash = 'etl-import'`
  );

  // Latest 5 movements
  const [movementRows] = await db.query(
    `SELECT movement.movement_id, movement.batch_id, movement_type.name as movement_type, movement.quantity, 
            movement.previous_quantity, movement.posterior_quantity, movement.reason, movement.datetime
     FROM movement
     INNER JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
     WHERE movement.reason LIKE '%Firebase%'
     ORDER BY movement.datetime DESC
     LIMIT 5`
  );

  // Latest 5 alerts
  const [alertRows] = await db.query(
    `SELECT alert.alert_id, alert_type.name as alert_type, alert_type.priority, alert.title, alert.message, alert.is_read, alert.created_at
     FROM alert
     INNER JOIN alert_type ON alert.alert_type_id = alert_type.alert_type_id
     WHERE alert.title LIKE 'Lote #%'
     ORDER BY alert.created_at DESC
     LIMIT 5`
  );

  // Latest 5 sessions
  const [sessionRows] = await db.query(
    `SELECT audit_session.session_id, audit_session.user_id, audit_session.ip_address, 
            audit_session.user_agent, audit_session.start_time, audit_session.is_active
     FROM audit_session
     WHERE audit_session.token_hash = 'etl-import'
     ORDER BY audit_session.start_time DESC
     LIMIT 5`
  );

  res.json({
    counts: {
      movements: movementCountRows[0],
      alerts: alertCountRows[0],
      sessions: sessionCountRows[0]
    },
    movements: movementRows,
    alerts: alertRows,
    sessions: sessionRows
  });
});

module.exports = { inventoryValuation, movementHistory, wasteReport, movementTypes, firebaseReport, mysqlVerification };
