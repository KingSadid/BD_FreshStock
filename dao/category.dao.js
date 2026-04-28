const db = require('../services/mysql.service');

const getAll = async () => {
  const [rows] = await db.query(`
    SELECT category.*, COUNT(product.sku) as product_count
    FROM category
    LEFT JOIN product ON category.category_id = product.category_id AND product.is_active = true
    WHERE category.is_active = true
    GROUP BY category.category_id
  `);
  return rows;
};

module.exports = { getAll };
