const db = require('../services/mysql.service');

const getInventoryValuation = async (category_id) => {
  let query = `
    SELECT 
      p.sku,
      p.name AS product_name,
      p.sale_price,
      c.name AS category_name,
      u.abbreviation AS unit_abbr,
      COALESCE(SUM(b.current_quantity), 0) AS total_stock,
      COALESCE(SUM(b.current_quantity * b.unit_cost), 0) AS total_cost_value,
      COALESCE(SUM(b.current_quantity * p.sale_price), 0) AS total_sale_value,
      COUNT(b.batch_id) AS active_batches
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    LEFT JOIN unit_of_measure u ON p.unit_id = u.unit_id
    LEFT JOIN batch b ON p.sku = b.product_sku AND b.status = 'active' AND b.current_quantity > 0
    WHERE p.is_active = TRUE
  `;
  const params = [];

  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }

  query += `
    GROUP BY p.sku, p.name, p.sale_price, c.name, u.abbreviation
    ORDER BY total_cost_value DESC
  `;

  const [rows] = await db.query(query, params);

  const [totals] = await db.query(`
    SELECT 
      COALESCE(SUM(b.current_quantity * b.unit_cost), 0) AS grand_total_cost,
      COALESCE(SUM(b.current_quantity * p.sale_price), 0) AS grand_total_sale
    FROM batch b
    JOIN product p ON b.product_sku = p.sku
    WHERE b.status = 'active' AND b.current_quantity > 0 AND p.is_active = TRUE
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
      m.movement_id,
      m.datetime,
      m.quantity,
      m.previous_quantity,
      m.posterior_quantity,
      m.reason,
      mt.name AS movement_type,
      mt.sign,
      b.batch_code,
      p.sku,
      p.name AS product_name,
      u.name AS user_name
    FROM movement m
    JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
    JOIN batch b ON m.batch_id = b.batch_id
    JOIN product p ON b.product_sku = p.sku
    JOIN user u ON m.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ' AND DATE(m.datetime) >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND DATE(m.datetime) <= ?';
    params.push(to);
  }
  if (movement_type_id) {
    query += ' AND m.movement_type_id = ?';
    params.push(movement_type_id);
  }
  if (product_sku) {
    query += ' AND p.sku = ?';
    params.push(product_sku);
  }

  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const [countResult] = await db.query(countQuery, params);

  query += ' ORDER BY m.datetime DESC LIMIT ? OFFSET ?';
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
      m.movement_id,
      m.datetime,
      m.quantity,
      m.reason,
      b.batch_code,
      b.unit_cost,
      (m.quantity * b.unit_cost) AS waste_cost,
      p.sku,
      p.name AS product_name,
      p.sale_price,
      (m.quantity * p.sale_price) AS waste_sale_value,
      c.name AS category_name,
      u.name AS user_name
    FROM movement m
    JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
    JOIN batch b ON m.batch_id = b.batch_id
    JOIN product p ON b.product_sku = p.sku
    LEFT JOIN category c ON p.category_id = c.category_id
    JOIN user u ON m.user_id = u.user_id
    WHERE mt.name = 'waste'
  `;
  const params = [];

  if (from) {
    query += ' AND DATE(m.datetime) >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND DATE(m.datetime) <= ?';
    params.push(to);
  }

  query += ' ORDER BY m.datetime DESC';

  const [rows] = await db.query(query, params);

  let summaryQuery = `
    SELECT 
      COUNT(*) AS total_waste_events,
      COALESCE(SUM(m.quantity), 0) AS total_units_wasted,
      COALESCE(SUM(m.quantity * b.unit_cost), 0) AS total_cost_loss,
      COALESCE(SUM(m.quantity * p.sale_price), 0) AS total_sale_value_loss
    FROM movement m
    JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
    JOIN batch b ON m.batch_id = b.batch_id
    JOIN product p ON b.product_sku = p.sku
    WHERE mt.name = 'waste'
  `;
  const summaryParams = [];

  if (from) {
    summaryQuery += ' AND DATE(m.datetime) >= ?';
    summaryParams.push(from);
  }
  if (to) {
    summaryQuery += ' AND DATE(m.datetime) <= ?';
    summaryParams.push(to);
  }

  const [summary] = await db.query(summaryQuery, summaryParams);

  let categoryQuery = `
    SELECT 
      c.name AS category_name,
      COALESCE(SUM(m.quantity), 0) AS units_wasted,
      COALESCE(SUM(m.quantity * b.unit_cost), 0) AS cost_loss
    FROM movement m
    JOIN movement_type mt ON m.movement_type_id = mt.movement_type_id
    JOIN batch b ON m.batch_id = b.batch_id
    JOIN product p ON b.product_sku = p.sku
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE mt.name = 'waste'
  `;
  const categoryParams = [];

  if (from) {
    categoryQuery += ' AND DATE(m.datetime) >= ?';
    categoryParams.push(from);
  }
  if (to) {
    categoryQuery += ' AND DATE(m.datetime) <= ?';
    categoryParams.push(to);
  }

  categoryQuery += ' GROUP BY c.category_id, c.name ORDER BY cost_loss DESC';

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
