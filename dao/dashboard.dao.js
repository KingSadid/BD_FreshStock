const db = require('../services/mysql.service');

const getKPIs = async (req, res) => {
  try {
    // Active products
    const [products] = await db.query(
      "SELECT COUNT(*) as count FROM product WHERE is_active = true"
    );
    
    // Registered lots
    const [batches] = await db.query(
      "SELECT COUNT(*) as count FROM batch"
    );
    
    // Expiration date (7 days)
    const [expiring] = await db.query(`
      SELECT COUNT(*) as count 
      FROM batch 
      WHERE status = 'active' 
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND current_quantity > 0
    `);
    
    // Critical stock (below minimum)
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

module.exports = { getKPIs };