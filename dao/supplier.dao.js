const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        supplier.*,
        COUNT(DISTINCT product_supplier.product_sku) as product_count,
        COUNT(DISTINCT batch.batch_id) as batch_count
      FROM supplier
      LEFT JOIN product_supplier ON supplier.supplier_id = product_supplier.supplier_id
      LEFT JOIN batch ON supplier.supplier_id = batch.supplier_id
      WHERE supplier.is_active = true
      GROUP BY supplier.supplier_id
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