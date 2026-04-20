const db = require('../services/mysql.service');

const getRecent = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        movement.movement_id, movement.datetime, movement.quantity, movement.reason,
        movement_type.name as movement_type, movement_type.sign,
        batch.batch_code,
        product.name as product_name, product.sku,
        user.name as user_name
      FROM movement
      JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
      JOIN batch ON movement.batch_id = batch.batch_id
      JOIN product ON batch.product_sku = product.sku
      JOIN user ON movement.user_id = user.user_id
      ORDER BY movement.datetime DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        movement_type.name as type,
        SUM(CASE WHEN movement_type.sign = '+' THEN movement.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN movement_type.sign = '-' THEN movement.quantity ELSE 0 END) as total_out,
        COUNT(*) as count
      FROM movement
      JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
      WHERE movement.datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY movement_type.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecent, getStats };