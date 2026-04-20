const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const [rows] = await db.query(`
      SELECT 
        batch.batch_id, batch.batch_code, batch.entry_date, batch.expiry_date,
        batch.initial_quantity, batch.current_quantity, batch.unit_cost,
        batch.warehouse_location, batch.status, batch.notes,
        product.sku, product.name as product_name, product.sale_price,
        unit_of_measure.abbreviation as unit_abbr,
        supplier.name as supplier_name
      FROM batch
      JOIN product ON batch.product_sku = product.sku
      LEFT JOIN unit_of_measure ON product.unit_id = unit_of_measure.unit_id
      LEFT JOIN supplier ON batch.supplier_id = supplier.supplier_id
      WHERE (? = 'all' OR batch.status = ?)
      ORDER BY batch.entry_date ASC, batch.batch_id ASC
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
        batch.*, supplier.name as supplier_name
      FROM batch
      LEFT JOIN supplier ON batch.supplier_id = supplier.supplier_id
      WHERE batch.product_sku = ? AND batch.status = 'active'
      ORDER BY batch.entry_date ASC
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
        batch.batch_id, batch.batch_code, batch.expiry_date, batch.current_quantity,
        product.sku, product.name as product_name,
        DATEDIFF(batch.expiry_date, CURDATE()) as days_remaining
      FROM batch
      JOIN product ON batch.product_sku = product.sku
      WHERE batch.status = 'active' 
        AND batch.current_quantity > 0
        AND batch.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY batch.expiry_date ASC
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