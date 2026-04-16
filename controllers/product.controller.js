const productDao = require('../dao/product.dao');

const getAll = async (req, res) => {
    try {
        const products = await productDao.getAllProducts();
        res.json({ data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productDao.getProductBySku(id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch product" });
    }
};

module.exports = { getAll, getOne };
