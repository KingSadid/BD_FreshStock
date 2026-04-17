const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT ps.product_sku) as product_count,
        COUNT(DISTINCT b.batch_id) as batch_count
      FROM supplier s
      LEFT JOIN product_supplier ps ON s.supplier_id = ps.supplier_id
      LEFT JOIN batch b ON s.supplier_id = b.supplier_id
      WHERE s.is_active = true
      GROUP BY s.supplier_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, contact_person, phone, email } = req.body;
    const [result] = await db.query(
      'INSERT INTO supplier (name, contact_person, phone, email) VALUES (?, ?, ?, ?)',
      [name, contact_person, phone, email]
    );
    res.status(201).json({ supplier_id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create };