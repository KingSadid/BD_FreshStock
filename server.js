const express = require("express");
const path = require("path");

const testRoutes = require("./routes/test.routes");
const productRoutes = require("./routes/products.routes");
const batchRoutes = require("./routes/batches.routes");
const supplierRoutes = require("./routes/suppliers.routes");
const categoryRoutes = require("./routes/categories.routes");
const movementRoutes = require("./routes/movements.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/users.routes");

const cors = require("cors");

const PORT = 5000;
const api = express();

api.use(cors());
api.use(express.json());
api.use(express.static("public"));

api.use("/api/test", testRoutes);
api.use("/api/products", productRoutes);
api.use("/api/batches", batchRoutes);
api.use("/api/suppliers", supplierRoutes);
api.use("/api/categories", categoryRoutes);
api.use("/api/movements", movementRoutes);
api.use("/api/dashboard", dashboardRoutes);
api.use("/api/users", userRoutes);

// Error handling middleware
api.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

api.listen(PORT, () => {
  console.log(`🚀 FreshStock Server running in http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API Endpoint: http://localhost:${PORT}/api`);
});