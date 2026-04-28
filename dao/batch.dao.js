const db = require('../services/mysql.service');
const AppError = require('../utils/AppError');

const getAll = async (status = 'active') => {
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
  return rows;
};

const getByProduct = async (sku) => {
  const [rows] = await db.query(`
    SELECT 
      batch.*, supplier.name as supplier_name
    FROM batch
    LEFT JOIN supplier ON batch.supplier_id = supplier.supplier_id
    WHERE batch.product_sku = ? AND batch.status = 'active'
    ORDER BY batch.entry_date ASC
  `, [sku]);
  return rows;
};

const create = async (data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      product_sku, supplier_id, branch_id = 1,
      entry_date, production_date, expiry_date,
      initial_quantity, unit_cost = 0, warehouse_location,
      notes
    } = data;

    if (!product_sku || !expiry_date || !initial_quantity) {
      throw new AppError('Faltan campos requeridos', 400);
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

    return {
      batch_id: result.insertId,
      batch_code,
      message: 'Lote registrado exitosamente'
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const updateQuantity = async (batchId, data) => {
  const { quantity, user_id = 1, reason } = data;

  const [batch] = await db.query(
    'SELECT current_quantity FROM batch WHERE batch_id = ?',
    [batchId]
  );

  if (!batch[0]) throw new AppError('Lote no encontrado', 404);

  const previous = batch[0].current_quantity;
  const posterior = previous - quantity;

  if (posterior < 0) {
    throw new AppError('Cantidad insuficiente en lote', 400);
  }

  await db.query(
    'UPDATE batch SET current_quantity = ? WHERE batch_id = ?',
    [posterior, batchId]
  );

  await db.query(
    `INSERT INTO movement 
     (batch_id, movement_type_id, user_id, quantity,
      previous_quantity, posterior_quantity, reason)
     VALUES (?, 2, ?, ?, ?, ?, ?)`,
    [batchId, user_id, quantity, previous, posterior, reason || 'Salida de inventario']
  );

  return { message: 'Stock actualizado', new_quantity: posterior };
};

const getExpiringBatches = async (days = 7) => {
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
  return rows;
};

const remove = async (batchId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM movement WHERE batch_id = ?', [batchId]);

    const [result] = await connection.query('DELETE FROM batch WHERE batch_id = ?', [batchId]);

    if (result.affectedRows === 0) {
      throw new AppError('Lote no encontrado', 404);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
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
