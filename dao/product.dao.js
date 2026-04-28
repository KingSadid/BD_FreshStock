const db = require('../services/mysql.service');
const AppError = require('../utils/AppError');

const getAll = async () => {
  const [rows] = await db.query(`
    SELECT 
      product.sku, product.barcode, product.name, product.description, 
      product.min_stock, product.sale_price, product.requires_refrigeration,
      product.expiry_alert_days, product.is_active,
      category.name as category_name, category.category_id,
      unit_of_measure.name as unit_name, unit_of_measure.abbreviation as unit_abbr
    FROM product
    LEFT JOIN category ON product.category_id = category.category_id
    LEFT JOIN unit_of_measure ON product.unit_id = unit_of_measure.unit_id
    WHERE product.is_active = true
  `);
  return rows;
};

const getBySku = async (sku) => {
  const [rows] = await db.query(`
    SELECT 
      product.*, 
      category.name as category_name,
      unit_of_measure.name as unit_name, unit_of_measure.abbreviation as unit_abbr
    FROM product
    LEFT JOIN category ON product.category_id = category.category_id
    LEFT JOIN unit_of_measure ON product.unit_id = unit_of_measure.unit_id
    WHERE product.sku = ?
  `, [sku]);
  return rows[0] || null;
};

const create = async (data) => {
  const { 
    sku, barcode, name, description, 
    category_id, unit_id = 5, min_stock = 0, 
    sale_price, requires_refrigeration = false, 
    expiry_alert_days = 7 
  } = data;

  if (!sku || !name || !sale_price) {
    throw new AppError('SKU, nombre y precio son requeridos', 400);
  }

  try {
    await db.query(
      `INSERT INTO product 
       (sku, barcode, name, description, category_id, unit_id, 
        min_stock, sale_price, requires_refrigeration, expiry_alert_days) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, barcode, name, description, category_id, unit_id, 
       min_stock, sale_price, requires_refrigeration, expiry_alert_days]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('SKU o código de barras ya existe', 409);
    }
    throw err;
  }
  
  return { sku, name, message: 'Producto creado exitosamente' };
};

const getStockSummary = async (sku) => {
  const [rows] = await db.query(`
    SELECT 
      product.sku, product.name, product.min_stock,
      COALESCE(SUM(batch.current_quantity), 0) as total_stock,
      COUNT(batch.batch_id) as active_lots,
      MIN(batch.expiry_date) as nearest_expiry
    FROM product
    LEFT JOIN batch ON product.sku = batch.product_sku 
      AND batch.status = 'active' AND batch.current_quantity > 0
    WHERE product.sku = ?
    GROUP BY product.sku
  `, [sku]);
  
  return rows[0] || { total_stock: 0, active_lots: 0 };
};

const update = async (sku, data) => {
  const { 
    name, description, category_id, unit_id, 
    min_stock, sale_price, requires_refrigeration, 
    expiry_alert_days, is_active 
  } = data;

  if (!name || !sale_price) {
    throw new AppError('Nombre y precio son requeridos', 400);
  }

  const [result] = await db.query(
    `UPDATE product SET 
      name = ?, description = ?, category_id = ?, unit_id = ?, 
      min_stock = ?, sale_price = ?, requires_refrigeration = ?, 
      expiry_alert_days = ?, is_active = ?
     WHERE sku = ?`,
    [name, description, category_id, unit_id, 
     min_stock, sale_price, requires_refrigeration, 
     expiry_alert_days, is_active !== undefined ? is_active : true, sku]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Producto no encontrado', 404);
  }

  return { message: 'Producto actualizado exitosamente' };
};

const deleteProduct = async (sku) => {
  const [batches] = await db.query('SELECT COUNT(*) as count FROM batch WHERE product_sku = ?', [sku]);
  
  if (batches[0].count > 0) {
    await db.query('UPDATE product SET is_active = false WHERE sku = ?', [sku]);
    return { message: 'Producto desactivado (borrado lógico) por tener lotes asociados' };
  }

  const [result] = await db.query('DELETE FROM product WHERE sku = ?', [sku]);
  
  if (result.affectedRows === 0) {
    throw new AppError('Producto no encontrado', 404);
  }

  return { message: 'Producto eliminado exitosamente' };
};

module.exports = { getAll, getBySku, create, getStockSummary, update, deleteProduct };
