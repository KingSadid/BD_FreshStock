const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, COUNT(p.sku) as product_count
      FROM category c
      LEFT JOIN product p ON c.category_id = p.category_id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.category_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll };