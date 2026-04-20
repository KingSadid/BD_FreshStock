const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT category.*, COUNT(product.sku) as product_count
      FROM category
      LEFT JOIN product ON category.category_id = product.category_id AND product.is_active = true
      WHERE category.is_active = true
      GROUP BY category.category_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };