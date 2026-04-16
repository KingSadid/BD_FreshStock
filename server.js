const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const PORT = 5000;
const api = express();

api.use(cors());
api.use(express.json());
api.use(express.static('public'));

api.use('/api/auth', authRoutes);
api.use('/api/products', productRoutes);
api.use('/api/dashboard', dashboardRoutes);

api.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});