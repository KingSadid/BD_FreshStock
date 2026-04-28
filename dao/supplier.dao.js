const db = require('../services/mysql.service');

const getAll = async () => {
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
  return rows;
};

const create = async (data) => {
  const { name, contact_person, phone, email } = data;
  const [result] = await db.query(
    'INSERT INTO supplier (name, contact_person, phone, email) VALUES (?, ?, ?, ?)',
    [name, contact_person, phone, email]
  );
  return { supplier_id: result.insertId, name };
};

module.exports = { getAll, create };
