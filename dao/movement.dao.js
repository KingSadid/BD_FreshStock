const db = require('../services/mysql.service');

const getRecent = async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        m.movement_id, m.datetime, m.quantity, m.reason,
        mt.name as movement_type, mt.sign,
        b.batch_code,
        p.name as product_name, p.sku,
        u.name as user_name
      FROM movement m
      JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
      JOIN batch b ON m.batch_id = b.batch_id
      JOIN product p ON b.product_sku = p.sku
      JOIN user u ON m.user_id = u.user_id
      ORDER BY m.datetime DESC
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
        mt.name as type,
        SUM(CASE WHEN mt.sign = '+' THEN m.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN mt.sign = '-' THEN m.quantity ELSE 0 END) as total_out,
        COUNT(*) as count
      FROM movement m
      JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
      WHERE m.datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY mt.name
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getRecent, getStats };