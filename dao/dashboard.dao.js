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
        SELECT product.sku, product.min_stock, COALESCE(SUM(batch.current_quantity), 0) as stock
        FROM product
        LEFT JOIN batch ON product.sku = batch.product_sku AND batch.status = 'active'
        WHERE product.is_active = true
        GROUP BY product.sku
        HAVING stock < product.min_stock
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
        SUM(CASE WHEN movement_type.sign = '+' THEN quantity ELSE 0 END) as entries,
        SUM(CASE WHEN movement_type.sign = '-' THEN quantity ELSE 0 END) as exits
      FROM movement
      JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
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
      SELECT category.name, COUNT(product.sku) as product_count
      FROM category
      LEFT JOIN product ON category.category_id = product.category_id
      WHERE category.is_active = true
      GROUP BY category.category_id, category.name
    `);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getKPIs, getMovementStats, getCategoryStats };