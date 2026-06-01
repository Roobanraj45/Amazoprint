const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in the environment.");
    process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
    try {
        console.log("Creating shipments table directly in the Neon PostgreSQL database...");
        
        await sql(`
            CREATE TABLE IF NOT EXISTS shipments (
              id SERIAL PRIMARY KEY,
              order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
              shipment_id VARCHAR(100),
              shiprocket_order_id VARCHAR(100),
              awb_code VARCHAR(100),
              courier_name VARCHAR(100),
              status VARCHAR(100),
              label_url TEXT,
              manifest_url TEXT,
              created_at TIMESTAMP DEFAULT NOW() NOT NULL,
              updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        
        console.log("Creating indexes on shipments table...");
        await sql(`CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);`);
        await sql(`CREATE INDEX IF NOT EXISTS idx_shipments_shipment_id ON shipments(shipment_id);`);
        await sql(`CREATE INDEX IF NOT EXISTS idx_shipments_awb_code ON shipments(awb_code);`);
        
        console.log("Successfully created shipments table and indexes!");
    } catch (err) {
        console.error("Error executing query:", err);
    }
}

run();
