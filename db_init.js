const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'localhost',
    user: 'root',
    password: '',  // Typical XAMPP setup
    multipleStatements: true
};

async function initDB() {
    console.log("Connecting to MySQL...");
    let connection;
    try {
        // Try without password
        connection = await mysql.createConnection(config);
    } catch (e) {
        if (e.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log("Access denied with empty password, trying with 'root'...");
            config.password = 'root';
            connection = await mysql.createConnection(config);
        } else {
            throw e;
        }
    }

    console.log("Connected successfully. Reading SQL file...");
    const schemaPath = path.join(__dirname, '..', 'freshstock_prototype', 'freshstock_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Executing SQL statements...");
    await connection.query(sql);

    console.log("Database freshstock initialized successfully!");
    connection.end();
}

initDB().catch(err => {
    console.error("Failed to initialize DB:");
    console.error(err);
    process.exit(1);
});
