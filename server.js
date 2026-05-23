const express = require("express");
const path = require("path");
const cors = require("cors");

const testRoutes = require("./routes/test.routes");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/products.routes");
const batchRoutes = require("./routes/batches.routes");
const supplierRoutes = require("./routes/suppliers.routes");
const categoryRoutes = require("./routes/categories.routes");
const movementRoutes = require("./routes/movements.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/users.routes");
const reportsRoutes = require("./routes/reports.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const etlRoutes = require("./routes/etl.routes");

const PORT = process.env.PORT || 5000;
const api = express();

api.use(cors());
api.use(express.json());
api.use(express.static("public"));

api.use("/api/test", testRoutes);
api.use("/api/auth", authRoutes);
api.use("/api/products", productRoutes);
api.use("/api/batches", batchRoutes);
api.use("/api/suppliers", supplierRoutes);
api.use("/api/categories", categoryRoutes);
api.use("/api/movements", movementRoutes);
api.use("/api/dashboard", dashboardRoutes);
api.use("/api/users", userRoutes);
api.use("/api/reports", reportsRoutes);
api.use("/api/analytics", analyticsRoutes);
api.use("/api/etl", etlRoutes);

api.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

api.listen(PORT, () => {
  console.log(` FreshStock Server running in http://localhost:${PORT}`);
  console.log(` Dashboard: http://localhost:${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api`);
});
