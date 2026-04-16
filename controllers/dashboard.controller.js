const dashboardDao = require('../dao/dashboard.dao');

const getDashboardKPIs = async (req, res) => {
    try {
        const kpis = await dashboardDao.getKPIs();
        res.json({ data: kpis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch dashboard KPIs" });
    }
};

module.exports = { getDashboardKPIs };
