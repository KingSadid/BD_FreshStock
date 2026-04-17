const db = require('../services/mysql.service');

const getKPIs = async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT COUNT(*) as count FROM product WHERE is_active = true"
    );
    
    const [batches] = await db.query(
      "SELECT COUNT(*) as count FROM batch"
    );
    
    const [expiring] = await db.query(`
      SELECT COUNT(*) as count 
      FROM batch 
      WHERE status = 'active' 
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND current_quantity > 0
    `);
    
    const [critical] = await db.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT p.sku, p.min_stock, COALESCE(SUM(b.current_quantity), 0) as stock
        FROM product p
        LEFT JOIN batch b ON p.sku = b.product_sku AND b.status = 'active'
        WHERE p.is_active = true
        GROUP BY p.sku
        HAVING stock < p.min_stock
      ) as low_stock
    `);

    res.json({
      active_products: products[0].count,
      total_batches: batches[0].count,
      expiring_soon: expiring[0].count,
      critical_stock: critical[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMovementStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        DATE(datetime) as date,
        SUM(CASE WHEN mt.sign = '+' THEN quantity ELSE 0 END) as entries,
        SUM(CASE WHEN mt.sign = '-' THEN quantity ELSE 0 END) as exits
      FROM movement m
      JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
      WHERE datetime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(datetime)
      ORDER BY DATE(datetime) ASC
    `);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT c.name, COUNT(p.sku) as product_count
      FROM category c
      LEFT JOIN product p ON c.category_id = p.category_id
      WHERE c.is_active = true
      GROUP BY c.category_id, c.name
    `);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getKPIs, getMovementStats, getCategoryStats };