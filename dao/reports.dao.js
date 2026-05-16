const db = require('../services/mysql.service');

const getInventoryValuation = async (category_id) => {
  let query = `
    SELECT 
      product.sku,
      product.name AS product_name,
      product.sale_price,
      category.name AS category_name,
      unit_of_measure.abbreviation AS unit_abbr,
      COALESCE(SUM(batch.current_quantity), 0) AS total_stock,
      COALESCE(SUM(batch.current_quantity * batch.unit_cost), 0) AS total_cost_value,
      COALESCE(SUM(batch.current_quantity * product.sale_price), 0) AS total_sale_value,
      COUNT(batch.batch_id) AS active_batches
    FROM product
    LEFT JOIN category ON product.category_id = category.category_id
    LEFT JOIN unit_of_measure ON product.unit_id = unit_of_measure.unit_id
    LEFT JOIN batch ON product.sku = batch.product_sku AND batch.status = 'active' AND batch.current_quantity > 0
    WHERE product.is_active = TRUE
  `;
  const params = [];

  if (category_id) {
    query += ' AND product.category_id = ?';
    params.push(category_id);
  }

  query += `
    GROUP BY product.sku, product.name, product.sale_price, category.name, unit_of_measure.abbreviation
    ORDER BY total_cost_value DESC
  `;

  const [rows] = await db.query(query, params);

  const [totals] = await db.query(`
    SELECT 
      COALESCE(SUM(batch.current_quantity * batch.unit_cost), 0) AS grand_total_cost,
      COALESCE(SUM(batch.current_quantity * product.sale_price), 0) AS grand_total_sale
    FROM batch
    JOIN product ON batch.product_sku = product.sku
    WHERE batch.status = 'active' AND batch.current_quantity > 0 AND product.is_active = TRUE
  `);

  return {
    products: rows,
    totals: totals[0]
  };
};

const getMovementHistory = async (filters) => {
  const { from, to, movement_type_id, product_sku, limit = 100, offset = 0 } = filters;

  let query = `
    SELECT 
      movement.movement_id,
      movement.datetime,
      movement.quantity,
      movement.previous_quantity,
      movement.posterior_quantity,
      movement.reason,
      movement_type.name AS movement_type,
      movement_type.sign,
      batch.batch_code,
      product.sku,
      product.name AS product_name,
      user.name AS user_name
    FROM movement
    JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
    JOIN batch ON movement.batch_id = batch.batch_id
    JOIN product ON batch.product_sku = product.sku
    JOIN user ON movement.user_id = user.user_id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ' AND DATE(movement.datetime) >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND DATE(movement.datetime) <= ?';
    params.push(to);
  }
  if (movement_type_id) {
    query += ' AND movement.movement_type_id = ?';
    params.push(movement_type_id);
  }
  if (product_sku) {
    query += ' AND product.sku = ?';
    params.push(product_sku);
  }

  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const [countResult] = await db.query(countQuery, params);

  query += ' ORDER BY movement.datetime DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [rows] = await db.query(query, params);

  return {
    movements: rows,
    total: countResult[0].total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
};

const getWasteReport = async (filters) => {
  const { from, to } = filters;

  let query = `
    SELECT 
      movement.movement_id,
      movement.datetime,
      movement.quantity,
      movement.reason,
      batch.batch_code,
      batch.unit_cost,
      (movement.quantity * batch.unit_cost) AS waste_cost,
      product.sku,
      product.name AS product_name,
      product.sale_price,
      (movement.quantity * product.sale_price) AS waste_sale_value,
      category.name AS category_name,
      user.name AS user_name
    FROM movement
    JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
    JOIN batch ON movement.batch_id = batch.batch_id
    JOIN product ON batch.product_sku = product.sku
    LEFT JOIN category ON product.category_id = category.category_id
    JOIN user ON movement.user_id = user.user_id
    WHERE movement_type.name = 'waste'
  `;
  const params = [];

  if (from) {
    query += ' AND DATE(movement.datetime) >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND DATE(movement.datetime) <= ?';
    params.push(to);
  }

  query += ' ORDER BY movement.datetime DESC';

  const [rows] = await db.query(query, params);

  let summaryQuery = `
    SELECT 
      COUNT(*) AS total_waste_events,
      COALESCE(SUM(movement.quantity), 0) AS total_units_wasted,
      COALESCE(SUM(movement.quantity * batch.unit_cost), 0) AS total_cost_loss,
      COALESCE(SUM(movement.quantity * product.sale_price), 0) AS total_sale_value_loss
    FROM movement
    JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
    JOIN batch ON movement.batch_id = batch.batch_id
    JOIN product ON batch.product_sku = product.sku
    WHERE movement_type.name = 'waste'
  `;
  const summaryParams = [];

  if (from) {
    summaryQuery += ' AND DATE(movement.datetime) >= ?';
    summaryParams.push(from);
  }
  if (to) {
    summaryQuery += ' AND DATE(movement.datetime) <= ?';
    summaryParams.push(to);
  }

  const [summary] = await db.query(summaryQuery, summaryParams);

  let categoryQuery = `
    SELECT 
      category.name AS category_name,
      COALESCE(SUM(movement.quantity), 0) AS units_wasted,
      COALESCE(SUM(movement.quantity * batch.unit_cost), 0) AS cost_loss
    FROM movement
    JOIN movement_type ON movement.movement_type_id = movement_type.movement_type_id
    JOIN batch ON movement.batch_id = batch.batch_id
    JOIN product ON batch.product_sku = product.sku
    LEFT JOIN category ON product.category_id = category.category_id
    WHERE movement_type.name = 'waste'
  `;
  const categoryParams = [];

  if (from) {
    categoryQuery += ' AND DATE(movement.datetime) >= ?';
    categoryParams.push(from);
  }
  if (to) {
    categoryQuery += ' AND DATE(movement.datetime) <= ?';
    categoryParams.push(to);
  }

  categoryQuery += ' GROUP BY category.category_id, category.name ORDER BY cost_loss DESC';

  const [byCategory] = await db.query(categoryQuery, categoryParams);

  return {
    details: rows,
    summary: summary[0],
    byCategory
  };
};

const getMovementTypes = async () => {
  const [rows] = await db.query('SELECT * FROM movement_type ORDER BY movement_type_id');
  return rows;
};

module.exports = { getInventoryValuation, getMovementHistory, getWasteReport, getMovementTypes };
