const db = require('../services/mysql.service');

const getAll = async (req, res) => {
  try {
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBySku = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        product.*, 
        category.name as category_name,
        unit_of_measure.name as unit_name, unit_of_measure.abbreviation as unit_abbr
      FROM product
      LEFT JOIN category ON product.category_id = category.category_id
      LEFT JOIN unit_of_measure ON product.unit_id = unit_of_measure.unit_id
      WHERE product.sku = ?
    `, [req.params.sku]);
    
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { 
      sku, barcode, name, description, 
      category_id, unit_id = 5, min_stock = 0, 
      sale_price, requires_refrigeration = false, 
      expiry_alert_days = 7 
    } = req.body;

    if (!sku || !name || !sale_price) {
      return res.status(400).json({ error: 'SKU, nombre y precio son requeridos' });
    }

    await db.query(
      `INSERT INTO product 
       (sku, barcode, name, description, category_id, unit_id, 
        min_stock, sale_price, requires_refrigeration, expiry_alert_days) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, barcode, name, description, category_id, unit_id, 
       min_stock, sale_price, requires_refrigeration, expiry_alert_days]
    );
    
    res.status(201).json({ 
      sku, name, message: 'Producto creado exitosamente' 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'SKU o código de barras ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
};

const getStockSummary = async (req, res) => {
  try {
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
    `, [req.params.sku]);
    
    res.json(rows[0] || { total_stock: 0, active_lots: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { sku } = req.params;
    const { 
      name, description, category_id, unit_id, 
      min_stock, sale_price, requires_refrigeration, 
      expiry_alert_days, is_active 
    } = req.body;

    if (!name || !sale_price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
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
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { sku } = req.params;
    
    
    const [batches] = await db.query('SELECT COUNT(*) as count FROM batch WHERE product_sku = ?', [sku]);
    
    if (batches[0].count > 0) {
      await db.query('UPDATE product SET is_active = false WHERE sku = ?', [sku]);
      return res.json({ message: 'Producto desactivado (borrado lógico) por tener lotes asociados' });
    }

    const [result] = await db.query('DELETE FROM product WHERE sku = ?', [sku]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getBySku, create, getStockSummary, update, deleteProduct };