const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const [rows] = await db.query(`
      SELECT 
        b.batch_id, b.batch_code, b.entry_date, b.expiry_date,
        b.initial_quantity, b.current_quantity, b.unit_cost,
        b.warehouse_location, b.status, b.notes,
        p.sku, p.name as product_name, p.sale_price,
        u.abbreviation as unit_abbr,
        s.name as supplier_name
      FROM batch b
      JOIN product p ON b.product_sku = p.sku
      LEFT JOIN unit_of_measure u ON p.unit_id = u.unit_id
      LEFT JOIN supplier s ON b.supplier_id = s.supplier_id
      WHERE (? = 'all' OR b.status = ?)
      ORDER BY b.entry_date ASC, b.batch_id ASC
    `, [status, status]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByProduct = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.*, s.name as supplier_name
      FROM batch b
      LEFT JOIN supplier s ON b.supplier_id = s.supplier_id
      WHERE b.product_sku = ? AND b.status = 'active'
      ORDER BY b.entry_date ASC
    `, [req.params.sku]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      product_sku, supplier_id, branch_id = 1,
      entry_date, production_date, expiry_date,
      initial_quantity, unit_cost = 0, warehouse_location,
      notes
    } = req.body;

    if (!product_sku || !expiry_date || !initial_quantity) {
      throw new Error('Faltan campos requeridos');
    }

    const batch_code = `L-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const [result] = await connection.query(
      `INSERT INTO batch 
       (batch_code, product_sku, supplier_id, branch_id, entry_date, 
        production_date, expiry_date, initial_quantity, current_quantity,
        unit_cost, warehouse_location, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batch_code, product_sku, supplier_id, branch_id, entry_date || new Date(),
        production_date, expiry_date, initial_quantity, initial_quantity,
        unit_cost, warehouse_location, notes]
    );

    await connection.query(
      `INSERT INTO movement 
       (batch_id, movement_type_id, user_id, quantity, 
        previous_quantity, posterior_quantity, reason) 
       VALUES (?, 1, 1, ?, 0, ?, 'Entrada inicial de inventario')`,
      [result.insertId, initial_quantity, initial_quantity]
    );

    await connection.commit();

    res.status(201).json({
      batch_id: result.insertId,
      batch_code,
      message: 'Lote registrado exitosamente'
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { quantity, user_id = 1, reason } = req.body;

    const [batch] = await db.query(
      'SELECT current_quantity FROM batch WHERE batch_id = ?',
      [batch_id]
    );

    if (!batch[0]) return res.status(404).json({ error: 'Lote no encontrado' });

    const previous = batch[0].current_quantity;
    const posterior = previous - quantity;

    if (posterior < 0) {
      return res.status(400).json({ error: 'Cantidad insuficiente en lote' });
    }

    await db.query(
      'UPDATE batch SET current_quantity = ? WHERE batch_id = ?',
      [posterior, batch_id]
    );

    await db.query(
      `INSERT INTO movement 
       (batch_id, movement_type_id, user_id, quantity,
        previous_quantity, posterior_quantity, reason)
       VALUES (?, 2, ?, ?, ?, ?, ?)`,
      [batch_id, user_id, quantity, previous, posterior, reason || 'Salida de inventario']
    );

    res.json({ message: 'Stock actualizado', new_quantity: posterior });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExpiringBatches = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const [rows] = await db.query(`
      SELECT 
        b.batch_id, b.batch_code, b.expiry_date, b.current_quantity,
        p.sku, p.name as product_name,
        DATEDIFF(b.expiry_date, CURDATE()) as days_remaining
      FROM batch b
      JOIN product p ON b.product_sku = p.sku
      WHERE b.status = 'active' 
        AND b.current_quantity > 0
        AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY b.expiry_date ASC
    `, [days]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { batch_id } = req.params;

    await connection.query('DELETE FROM movement WHERE batch_id = ?', [batch_id]);

    const [result] = await connection.query('DELETE FROM batch WHERE batch_id = ?', [batch_id]);

    if (result.affectedRows === 0) {
      throw new Error('Lote no encontrado');
    }

    await connection.commit();
    res.json({ message: 'Lote eliminado permanentemente' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAll,
  getByProduct,
  create,
  updateQuantity,
  getExpiringBatches,
  remove
};